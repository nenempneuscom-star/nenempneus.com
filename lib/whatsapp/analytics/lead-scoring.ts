import { db } from '../../db'

// Sistema de pontuação de leads baseado em comportamento

export interface PontuacaoDetalhada {
    total: number
    fatores: {
        engajamento: number
        intencao: number
        urgencia: number
        perfil: number
    }
    detalhes: string[]
}

// Calcula pontuação do lead baseado em vários fatores
export async function calcularPontuacaoLead(
    conversaId: string
): Promise<PontuacaoDetalhada> {
    const pontuacao: PontuacaoDetalhada = {
        total: 0,
        fatores: {
            engajamento: 0,
            intencao: 0,
            urgencia: 0,
            perfil: 0,
        },
        detalhes: [],
    }

    try {
        const conversa = await db.conversaWhatsApp.findUnique({
            where: { id: conversaId },
            include: {
                mensagens: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                metricas: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        })

        if (!conversa) return pontuacao

        // ========================================
        // 1. ENGAJAMENTO (0-30 pontos)
        // ========================================

        // Número de mensagens (max 15 pontos)
        const numMensagens = conversa.totalMensagens
        if (numMensagens >= 10) {
            pontuacao.fatores.engajamento += 15
            pontuacao.detalhes.push('Alto volume de mensagens (+15)')
        } else if (numMensagens >= 5) {
            pontuacao.fatores.engajamento += 10
            pontuacao.detalhes.push('Bom volume de mensagens (+10)')
        } else if (numMensagens >= 2) {
            pontuacao.fatores.engajamento += 5
            pontuacao.detalhes.push('Conversação iniciada (+5)')
        }

        // Tempo de resposta do cliente (max 10 pontos)
        const mensagensCliente = conversa.mensagens.filter(m => m.direcao === 'entrada')
        if (mensagensCliente.length >= 3) {
            pontuacao.fatores.engajamento += 10
            pontuacao.detalhes.push('Cliente respondendo ativamente (+10)')
        } else if (mensagensCliente.length >= 1) {
            pontuacao.fatores.engajamento += 5
            pontuacao.detalhes.push('Cliente engajado (+5)')
        }

        // Recência - última mensagem (max 5 pontos)
        if (conversa.ultimaMensagemEm) {
            const horasDesdeUltima = (Date.now() - conversa.ultimaMensagemEm.getTime()) / (1000 * 60 * 60)
            if (horasDesdeUltima < 1) {
                pontuacao.fatores.engajamento += 5
                pontuacao.detalhes.push('Conversa muito recente (+5)')
            } else if (horasDesdeUltima < 24) {
                pontuacao.fatores.engajamento += 3
                pontuacao.detalhes.push('Conversa recente (+3)')
            }
        }

        // ========================================
        // 2. INTENÇÃO DE COMPRA (0-35 pontos)
        // ========================================

        const todasMensagens = conversa.mensagens.map(m => m.conteudo.toLowerCase()).join(' ')

        // Palavras de alta intenção (max 15 pontos)
        const palavrasAltaIntencao = ['quero', 'comprar', 'fechar', 'levar', 'pode ser', 'vou querer', 'confirma']
        const temAltaIntencao = palavrasAltaIntencao.some(p => todasMensagens.includes(p))
        if (temAltaIntencao) {
            pontuacao.fatores.intencao += 15
            pontuacao.detalhes.push('Demonstrou intenção de compra (+15)')
        }

        // Perguntou preço/orçamento (max 10 pontos)
        const perguntouPreco = /pre[çc]o|valor|quanto|or[çc]amento/.test(todasMensagens)
        if (perguntouPreco) {
            pontuacao.fatores.intencao += 10
            pontuacao.detalhes.push('Interessado em preço (+10)')
        }

        // Informou veículo (max 5 pontos)
        if (conversa.veiculoInfo) {
            pontuacao.fatores.intencao += 5
            pontuacao.detalhes.push('Informou veículo (+5)')
        }

        // Eventos do funil (max 5 pontos)
        const eventosPositivos = conversa.metricas?.filter(m =>
            ['orcamento_enviado', 'link_checkout'].includes(m.evento)
        ).length || 0
        if (eventosPositivos > 0) {
            pontuacao.fatores.intencao += 5
            pontuacao.detalhes.push('Avançou no funil (+5)')
        }

        // ========================================
        // 3. URGÊNCIA (0-20 pontos)
        // ========================================

        // Palavras de urgência (max 15 pontos)
        const palavrasUrgencia = ['hoje', 'agora', 'urgente', 'preciso', 'amanha', 'amanhã', 'logo', 'rápido']
        const temUrgencia = palavrasUrgencia.some(p => todasMensagens.includes(p))
        if (temUrgencia) {
            pontuacao.fatores.urgencia += 15
            pontuacao.detalhes.push('Demonstrou urgência (+15)')
        }

        // Perguntou sobre agendamento (max 5 pontos)
        const perguntouAgendamento = /agendar|instalar|hor[áa]rio|marcar/.test(todasMensagens)
        if (perguntouAgendamento) {
            pontuacao.fatores.urgencia += 5
            pontuacao.detalhes.push('Quer agendar (+5)')
        }

        // ========================================
        // 4. PERFIL (0-15 pontos)
        // ========================================

        // Informou nome (max 5 pontos)
        if (conversa.nomeContato && conversa.nomeContato.length > 2) {
            pontuacao.fatores.perfil += 5
            pontuacao.detalhes.push('Nome identificado (+5)')
        }

        // Conversa ativa (não perdida) (max 5 pontos)
        if (conversa.etapaFunil !== 'perdido') {
            pontuacao.fatores.perfil += 5
            pontuacao.detalhes.push('Lead ativo (+5)')
        }

        // Não pediu transferência para humano (max 5 pontos)
        const pedidoHumano = /atendente|humano|pessoa|falar com/.test(todasMensagens)
        if (!pedidoHumano) {
            pontuacao.fatores.perfil += 5
            pontuacao.detalhes.push('Satisfeito com atendimento IA (+5)')
        }

        // ========================================
        // CÁLCULO FINAL
        // ========================================

        pontuacao.total =
            pontuacao.fatores.engajamento +
            pontuacao.fatores.intencao +
            pontuacao.fatores.urgencia +
            pontuacao.fatores.perfil

        // Limita a 100
        pontuacao.total = Math.min(100, pontuacao.total)

        // Atualiza no banco
        await db.conversaWhatsApp.update({
            where: { id: conversaId },
            data: { pontuacaoLead: pontuacao.total },
        })

        return pontuacao
    } catch (error) {
        console.error('Erro ao calcular pontuação:', error)
        return pontuacao
    }
}

// Classifica o lead baseado na pontuação
export function classificarLead(pontuacao: number): {
    classificacao: 'frio' | 'morno' | 'quente' | 'muito_quente'
    emoji: string
    descricao: string
    acaoRecomendada: string
} {
    if (pontuacao >= 70) {
        return {
            classificacao: 'muito_quente',
            emoji: '🔥',
            descricao: 'Lead muito quente',
            acaoRecomendada: 'Prioridade máxima! Enviar link de checkout imediatamente.',
        }
    }

    if (pontuacao >= 50) {
        return {
            classificacao: 'quente',
            emoji: '🟠',
            descricao: 'Lead quente',
            acaoRecomendada: 'Enviar orçamento e propor agendamento.',
        }
    }

    if (pontuacao >= 30) {
        return {
            classificacao: 'morno',
            emoji: '🟡',
            descricao: 'Lead morno',
            acaoRecomendada: 'Continuar qualificação e nutrir com informações.',
        }
    }

    return {
        classificacao: 'frio',
        emoji: '🔵',
        descricao: 'Lead frio',
        acaoRecomendada: 'Manter contato e agendar follow-up.',
    }
}

// Atualiza etapa do funil baseado em eventos
export async function atualizarEtapaFunil(
    conversaId: string,
    evento: string
): Promise<string> {
    const mapaEventoEtapa: Record<string, string> = {
        'mensagem_recebida': 'qualificando',
        'lead_qualificado': 'qualificando',
        'orcamento_enviado': 'orcamento',
        'link_checkout': 'negociando',
        'conversao': 'convertido',
        'perda': 'perdido',
    }

    const novaEtapa = mapaEventoEtapa[evento]
    if (!novaEtapa) return ''

    try {
        // Verifica etapa atual
        const conversa = await db.conversaWhatsApp.findUnique({
            where: { id: conversaId },
        })

        if (!conversa) return ''

        // Ordem das etapas (não permite voltar, exceto para perdido)
        const ordemEtapas = ['novo', 'qualificando', 'orcamento', 'negociando', 'fechando', 'convertido']
        const etapaAtualIndex = ordemEtapas.indexOf(conversa.etapaFunil)
        const novaEtapaIndex = ordemEtapas.indexOf(novaEtapa)

        // Só avança se a nova etapa for posterior (ou se for 'perdido')
        if (novaEtapa === 'perdido' || novaEtapaIndex > etapaAtualIndex) {
            await db.conversaWhatsApp.update({
                where: { id: conversaId },
                data: { etapaFunil: novaEtapa },
            })
            return novaEtapa
        }

        return conversa.etapaFunil
    } catch (error) {
        console.error('Erro ao atualizar etapa do funil:', error)
        return ''
    }
}

// Busca leads por classificação
export async function buscarLeadsPorClassificacao(
    lojaId: string,
    classificacao: 'frio' | 'morno' | 'quente' | 'muito_quente'
) {
    const ranges = {
        muito_quente: { min: 70, max: 100 },
        quente: { min: 50, max: 69 },
        morno: { min: 30, max: 49 },
        frio: { min: 0, max: 29 },
    }

    const range = ranges[classificacao]

    return db.conversaWhatsApp.findMany({
        where: {
            lojaId,
            pontuacaoLead: { gte: range.min, lte: range.max },
            etapaFunil: { notIn: ['convertido', 'perdido'] },
        },
        orderBy: { pontuacaoLead: 'desc' },
        take: 20,
    })
}

// Busca leads que precisam de follow-up
export async function buscarLeadsParaFollowUp(lojaId: string) {
    const agora = new Date()

    return db.conversaWhatsApp.findMany({
        where: {
            lojaId,
            etapaFunil: { notIn: ['convertido', 'perdido'] },
            OR: [
                // Follow-up agendado para agora ou passado
                { proximoFollowUp: { lte: agora } },
                // Sem resposta há mais de 24h e pontuação >= 30
                {
                    ultimaMensagemEm: {
                        lte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                    pontuacaoLead: { gte: 30 },
                },
            ],
        },
        orderBy: [
            { pontuacaoLead: 'desc' },
            { ultimaMensagemEm: 'asc' },
        ],
        take: 20,
    })
}
