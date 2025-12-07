import { db } from '../../db'
import { LOJA_SLUG } from '../../constants'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

// Tipos de eventos do funil
export type EventoFunil =
    | 'mensagem_recebida'
    | 'mensagem_enviada'
    | 'lead_qualificado'
    | 'orcamento_enviado'
    | 'link_checkout'
    | 'conversao'
    | 'perda'
    | 'follow_up_enviado'
    | 'transferencia_humano'

// Registra evento de métrica
export async function registrarEvento(
    conversaId: string,
    evento: EventoFunil,
    dados?: Record<string, any>
): Promise<void> {
    try {
        await db.metricaConversa.create({
            data: {
                conversaId,
                evento,
                dados: dados ?? undefined,
            },
        })
    } catch (error) {
        console.error('Erro ao registrar evento:', error)
    }
}

// Atualiza métricas diárias
export async function atualizarMetricasDiarias(
    lojaId: string,
    data: Date = new Date()
): Promise<void> {
    try {
        const inicio = startOfDay(data)
        const fim = endOfDay(data)

        // Conta conversas
        const conversasNovas = await db.conversaWhatsApp.count({
            where: {
                lojaId,
                createdAt: { gte: inicio, lte: fim },
            },
        })

        const conversasAtivas = await db.conversaWhatsApp.count({
            where: {
                lojaId,
                ultimaMensagemEm: { gte: inicio, lte: fim },
            },
        })

        // Conta mensagens
        const mensagens = await db.mensagemWhatsApp.groupBy({
            by: ['direcao'],
            where: {
                conversa: { lojaId },
                createdAt: { gte: inicio, lte: fim },
            },
            _count: true,
        })

        const mensagensEntrada = mensagens.find(m => m.direcao === 'entrada')?._count || 0
        const mensagensSaida = mensagens.find(m => m.direcao === 'saida')?._count || 0

        // Conta eventos do funil
        const eventos = await db.metricaConversa.groupBy({
            by: ['evento'],
            where: {
                conversa: { lojaId },
                createdAt: { gte: inicio, lte: fim },
            },
            _count: true,
        })

        const getEventoCount = (evento: string) =>
            eventos.find(e => e.evento === evento)?._count || 0

        // Calcula valores
        const conversoes = getEventoCount('conversao')
        const orcamentos = getEventoCount('orcamento_enviado')
        const taxaConversao = orcamentos > 0 ? (conversoes / orcamentos) * 100 : 0

        // Upsert métricas
        await db.metricaWhatsAppDiaria.upsert({
            where: {
                lojaId_data: { lojaId, data: inicio },
            },
            create: {
                lojaId,
                data: inicio,
                conversasNovas,
                conversasAtivas,
                totalMensagens: mensagensEntrada + mensagensSaida,
                mensagensEntrada,
                mensagensSaida,
                leadsNovos: conversasNovas,
                leadsQualificados: getEventoCount('lead_qualificado'),
                orcamentosEnviados: orcamentos,
                linksCheckoutEnviados: getEventoCount('link_checkout'),
                conversoes,
                perdas: getEventoCount('perda'),
                taxaConversao,
            },
            update: {
                conversasNovas,
                conversasAtivas,
                totalMensagens: mensagensEntrada + mensagensSaida,
                mensagensEntrada,
                mensagensSaida,
                leadsNovos: conversasNovas,
                leadsQualificados: getEventoCount('lead_qualificado'),
                orcamentosEnviados: orcamentos,
                linksCheckoutEnviados: getEventoCount('link_checkout'),
                conversoes,
                perdas: getEventoCount('perda'),
                taxaConversao,
            },
        })
    } catch (error) {
        console.error('Erro ao atualizar métricas diárias:', error)
    }
}

// Busca métricas de hoje
export async function getMetricasHoje(lojaId?: string) {
    try {
        const loja = lojaId ? { id: lojaId } : await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) return null

        const hoje = startOfDay(new Date())

        const metricas = await db.metricaWhatsAppDiaria.findUnique({
            where: {
                lojaId_data: { lojaId: loja.id, data: hoje },
            },
        })

        // Se não existir, calcula em tempo real
        if (!metricas) {
            return calcularMetricasTempoReal(loja.id)
        }

        return metricas
    } catch (error) {
        console.error('Erro ao buscar métricas de hoje:', error)
        return null
    }
}

// Calcula métricas em tempo real
async function calcularMetricasTempoReal(lojaId: string) {
    const inicio = startOfDay(new Date())
    const fim = endOfDay(new Date())

    const [conversasNovas, conversasAtivas, mensagensEntrada, mensagensSaida] = await Promise.all([
        db.conversaWhatsApp.count({
            where: { lojaId, createdAt: { gte: inicio, lte: fim } },
        }),
        db.conversaWhatsApp.count({
            where: { lojaId, ultimaMensagemEm: { gte: inicio, lte: fim } },
        }),
        db.mensagemWhatsApp.count({
            where: {
                conversa: { lojaId },
                direcao: 'entrada',
                createdAt: { gte: inicio, lte: fim },
            },
        }),
        db.mensagemWhatsApp.count({
            where: {
                conversa: { lojaId },
                direcao: 'saida',
                createdAt: { gte: inicio, lte: fim },
            },
        }),
    ])

    return {
        conversasNovas,
        conversasAtivas,
        totalMensagens: mensagensEntrada + mensagensSaida,
        mensagensEntrada,
        mensagensSaida,
        leadsNovos: conversasNovas,
        conversoes: 0,
        taxaConversao: 0,
    }
}

// Busca métricas dos últimos N dias
export async function getMetricasPeriodo(dias: number = 7, lojaId?: string) {
    try {
        const loja = lojaId ? { id: lojaId } : await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) return []

        const dataInicio = startOfDay(subDays(new Date(), dias - 1))

        const metricas = await db.metricaWhatsAppDiaria.findMany({
            where: {
                lojaId: loja.id,
                data: { gte: dataInicio },
            },
            orderBy: { data: 'asc' },
        })

        return metricas
    } catch (error) {
        console.error('Erro ao buscar métricas do período:', error)
        return []
    }
}

// Resumo do funil de vendas
export async function getResumoFunil(lojaId?: string) {
    try {
        const loja = lojaId ? { id: lojaId } : await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) return null

        const conversas = await db.conversaWhatsApp.groupBy({
            by: ['etapaFunil'],
            where: { lojaId: loja.id },
            _count: true,
            _sum: { pontuacaoLead: true },
        })

        const etapas = ['novo', 'qualificando', 'orcamento', 'negociando', 'fechando', 'convertido', 'perdido']

        const funil = etapas.map(etapa => {
            const dados = conversas.find(c => c.etapaFunil === etapa)
            return {
                etapa,
                quantidade: dados?._count || 0,
                pontuacaoMedia: dados?._sum?.pontuacaoLead
                    ? Math.round(dados._sum.pontuacaoLead / dados._count)
                    : 0,
            }
        })

        // Calcula taxas de conversão entre etapas
        const taxasConversao = []
        for (let i = 0; i < funil.length - 2; i++) { // Exclui 'convertido' e 'perdido'
            const atual = funil[i].quantidade
            const proximo = funil[i + 1].quantidade
            const taxa = atual > 0 ? (proximo / atual) * 100 : 0
            taxasConversao.push({
                de: funil[i].etapa,
                para: funil[i + 1].etapa,
                taxa: Math.round(taxa * 10) / 10,
            })
        }

        return { funil, taxasConversao }
    } catch (error) {
        console.error('Erro ao buscar resumo do funil:', error)
        return null
    }
}

// Dashboard completo de métricas
export async function getDashboardMetricas(lojaId?: string) {
    try {
        const loja = lojaId ? { id: lojaId } : await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) return null

        const [hoje, ultimos7Dias, funil, conversasRecentes] = await Promise.all([
            getMetricasHoje(loja.id),
            getMetricasPeriodo(7, loja.id),
            getResumoFunil(loja.id),
            db.conversaWhatsApp.findMany({
                where: { lojaId: loja.id },
                orderBy: { ultimaMensagemEm: 'desc' },
                take: 10,
                include: {
                    _count: { select: { mensagens: true } },
                },
            }),
        ])

        // Calcula totais dos últimos 7 dias
        const totais7Dias = ultimos7Dias.reduce(
            (acc, dia) => ({
                conversas: acc.conversas + dia.conversasNovas,
                mensagens: acc.mensagens + dia.totalMensagens,
                conversoes: acc.conversoes + dia.conversoes,
                orcamentos: acc.orcamentos + dia.orcamentosEnviados,
            }),
            { conversas: 0, mensagens: 0, conversoes: 0, orcamentos: 0 }
        )

        // Taxa de conversão geral
        const taxaConversaoGeral = totais7Dias.orcamentos > 0
            ? (totais7Dias.conversoes / totais7Dias.orcamentos) * 100
            : 0

        return {
            hoje,
            ultimos7Dias,
            totais7Dias,
            taxaConversaoGeral: Math.round(taxaConversaoGeral * 10) / 10,
            funil,
            conversasRecentes: conversasRecentes.map(c => ({
                id: c.id,
                nome: c.nomeContato,
                telefone: c.telefone,
                etapa: c.etapaFunil,
                pontuacao: c.pontuacaoLead,
                totalMensagens: c._count.mensagens,
                ultimaMensagem: c.ultimaMensagemEm,
            })),
        }
    } catch (error) {
        console.error('Erro ao buscar dashboard:', error)
        return null
    }
}
