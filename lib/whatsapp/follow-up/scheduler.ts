import { db } from '../../db'
import { LOJA_SLUG } from '../../constants'
import { addHours, addDays, isBefore } from 'date-fns'
import { gerarFollowUp } from '../bot'
import { WhatsAppClient } from '../client'
import { salvarMensagemEnviada } from '../messages'

export type TipoFollowUp = 'orcamento' | 'carrinho_abandonado' | 'pos_venda' | 'reengajamento'

// Agenda um follow-up para uma conversa
export async function agendarFollowUp(
    conversaId: string,
    tipo: TipoFollowUp,
    horasAte: number = 24,
    mensagemPersonalizada?: string
): Promise<boolean> {
    try {
        const agendadoPara = addHours(new Date(), horasAte)

        await db.followUpAgendado.create({
            data: {
                conversaId,
                tipo,
                mensagem: mensagemPersonalizada,
                agendadoPara,
            },
        })

        // Atualiza a conversa com a data do próximo follow-up
        await db.conversaWhatsApp.update({
            where: { id: conversaId },
            data: { proximoFollowUp: agendadoPara },
        })

        console.log(`📅 Follow-up agendado para ${agendadoPara.toISOString()}`)
        return true
    } catch (error) {
        console.error('Erro ao agendar follow-up:', error)
        return false
    }
}

// Cancela follow-ups pendentes de uma conversa
export async function cancelarFollowUps(conversaId: string): Promise<void> {
    try {
        await db.followUpAgendado.updateMany({
            where: {
                conversaId,
                enviado: false,
                cancelado: false,
            },
            data: { cancelado: true },
        })

        await db.conversaWhatsApp.update({
            where: { id: conversaId },
            data: { proximoFollowUp: null },
        })
    } catch (error) {
        console.error('Erro ao cancelar follow-ups:', error)
    }
}

// Busca follow-ups que precisam ser enviados
export async function buscarFollowUpsPendentes(): Promise<Array<{
    id: string
    conversaId: string
    tipo: string
    mensagem: string | null
    conversa: {
        id: string
        telefone: string
        nomeContato: string | null
        modo: string
    }
}>> {
    try {
        const agora = new Date()

        const followUps = await db.followUpAgendado.findMany({
            where: {
                enviado: false,
                cancelado: false,
                agendadoPara: { lte: agora },
            },
            orderBy: { agendadoPara: 'asc' },
        })

        // Buscar dados das conversas
        const resultado = []
        for (const fu of followUps) {
            const conversa = await db.conversaWhatsApp.findUnique({
                where: { id: fu.conversaId },
                select: {
                    id: true,
                    telefone: true,
                    nomeContato: true,
                    modo: true,
                    etapaFunil: true,
                },
            })

            if (conversa && conversa.etapaFunil !== 'convertido' && conversa.etapaFunil !== 'perdido') {
                resultado.push({
                    ...fu,
                    conversa,
                })
            }
        }

        return resultado
    } catch (error) {
        console.error('Erro ao buscar follow-ups pendentes:', error)
        return []
    }
}

// Processa e envia follow-ups pendentes
export async function processarFollowUps(): Promise<{
    enviados: number
    erros: number
}> {
    const resultado = { enviados: 0, erros: 0 }

    try {
        const pendentes = await buscarFollowUpsPendentes()

        if (pendentes.length === 0) {
            console.log('✅ Nenhum follow-up pendente')
            return resultado
        }

        console.log(`📤 Processando ${pendentes.length} follow-ups...`)

        const client = new WhatsAppClient()

        for (const fu of pendentes) {
            try {
                // Gera mensagem de follow-up
                const mensagem = fu.mensagem || gerarFollowUp(
                    fu.conversa.nomeContato || '',
                    fu.tipo as 'orcamento' | 'interesse' | 'abandonou'
                )

                // Envia via WhatsApp
                await client.sendMessage(fu.conversa.telefone, mensagem)

                // Salva mensagem no histórico
                await salvarMensagemEnviada(fu.conversa.id, mensagem)

                // Marca como enviado
                await db.followUpAgendado.update({
                    where: { id: fu.id },
                    data: {
                        enviado: true,
                        enviadoEm: new Date(),
                    },
                })

                // Limpa próximo follow-up da conversa
                await db.conversaWhatsApp.update({
                    where: { id: fu.conversa.id },
                    data: { proximoFollowUp: null },
                })

                resultado.enviados++
                console.log(`✅ Follow-up enviado para ${fu.conversa.telefone}`)
            } catch (error) {
                console.error(`❌ Erro ao enviar follow-up para ${fu.conversa.telefone}:`, error)
                resultado.erros++
            }
        }

        return resultado
    } catch (error) {
        console.error('Erro ao processar follow-ups:', error)
        return resultado
    }
}

// Agenda follow-ups automáticos baseado na etapa do funil
export async function agendarFollowUpAutomatico(
    conversaId: string,
    etapaFunil: string
): Promise<void> {
    // Cancela follow-ups anteriores
    await cancelarFollowUps(conversaId)

    // Define tempo baseado na etapa
    const configPorEtapa: Record<string, { tipo: TipoFollowUp; horas: number }> = {
        'qualificando': { tipo: 'reengajamento', horas: 48 },
        'orcamento': { tipo: 'orcamento', horas: 24 },
        'negociando': { tipo: 'orcamento', horas: 12 },
        'fechando': { tipo: 'orcamento', horas: 6 },
    }

    const config = configPorEtapa[etapaFunil]
    if (config) {
        await agendarFollowUp(conversaId, config.tipo, config.horas)
    }
}

// Busca conversas que precisam de follow-up (sem interação recente)
export async function buscarConversasParaFollowUp(lojaId?: string): Promise<Array<{
    id: string
    telefone: string
    nomeContato: string | null
    etapaFunil: string
    pontuacaoLead: number
    horasSemInteracao: number
}>> {
    try {
        const loja = lojaId ? { id: lojaId } : await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) return []

        const agora = new Date()
        const limite24h = addHours(agora, -24)
        const limite48h = addHours(agora, -48)

        // Conversas quentes (pontuação >= 50) sem interação há 24h
        // Conversas mornas (pontuação >= 30) sem interação há 48h
        const conversas = await db.conversaWhatsApp.findMany({
            where: {
                lojaId: loja.id,
                etapaFunil: { notIn: ['convertido', 'perdido', 'novo'] },
                proximoFollowUp: null, // Sem follow-up agendado
                OR: [
                    {
                        pontuacaoLead: { gte: 50 },
                        ultimaMensagemEm: { lte: limite24h },
                    },
                    {
                        pontuacaoLead: { gte: 30, lt: 50 },
                        ultimaMensagemEm: { lte: limite48h },
                    },
                ],
            },
            orderBy: { pontuacaoLead: 'desc' },
            take: 20,
        })

        return conversas.map(c => ({
            id: c.id,
            telefone: c.telefone,
            nomeContato: c.nomeContato,
            etapaFunil: c.etapaFunil,
            pontuacaoLead: c.pontuacaoLead,
            horasSemInteracao: c.ultimaMensagemEm
                ? Math.round((agora.getTime() - c.ultimaMensagemEm.getTime()) / (1000 * 60 * 60))
                : 999,
        }))
    } catch (error) {
        console.error('Erro ao buscar conversas para follow-up:', error)
        return []
    }
}
