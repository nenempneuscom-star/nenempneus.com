import { db } from '../../db'
import { agendarFollowUp, cancelarFollowUps } from './scheduler'
import { registrarEvento } from '../analytics/metrics'
import { calcularPontuacaoLead, atualizarEtapaFunil } from '../analytics/lead-scoring'

// Triggers automáticos baseados em eventos do sistema

// Trigger: Nova mensagem recebida
export async function onMensagemRecebida(
    conversaId: string,
    mensagem: string
): Promise<void> {
    try {
        // Registra evento
        await registrarEvento(conversaId, 'mensagem_recebida', { tamanho: mensagem.length })

        // Cancela follow-ups pendentes (cliente voltou a interagir)
        await cancelarFollowUps(conversaId)

        // Recalcula pontuação do lead
        await calcularPontuacaoLead(conversaId)

        // Verifica se deve mudar etapa do funil
        const conversa = await db.conversaWhatsApp.findUnique({
            where: { id: conversaId },
        })

        if (conversa?.etapaFunil === 'novo') {
            await atualizarEtapaFunil(conversaId, 'mensagem_recebida')
        }
    } catch (error) {
        console.error('Erro no trigger onMensagemRecebida:', error)
    }
}

// Trigger: Mensagem enviada pelo bot
export async function onMensagemEnviada(
    conversaId: string,
    mensagem: string,
    porBot: boolean = true
): Promise<void> {
    try {
        await registrarEvento(conversaId, 'mensagem_enviada', { porBot, tamanho: mensagem.length })
    } catch (error) {
        console.error('Erro no trigger onMensagemEnviada:', error)
    }
}

// Trigger: Orçamento enviado
export async function onOrcamentoEnviado(
    conversaId: string,
    valorOrcamento: number
): Promise<void> {
    try {
        // Registra evento
        await registrarEvento(conversaId, 'orcamento_enviado', { valor: valorOrcamento })

        // Atualiza etapa do funil
        await atualizarEtapaFunil(conversaId, 'orcamento_enviado')

        // Atualiza valor potencial da conversa
        await db.conversaWhatsApp.update({
            where: { id: conversaId },
            data: { valorPotencial: valorOrcamento },
        })

        // Agenda follow-up em 24h se não tiver resposta
        await agendarFollowUp(conversaId, 'orcamento', 24)

        // Recalcula pontuação
        await calcularPontuacaoLead(conversaId)
    } catch (error) {
        console.error('Erro no trigger onOrcamentoEnviado:', error)
    }
}

// Trigger: Link de checkout enviado
export async function onLinkCheckoutEnviado(
    conversaId: string,
    link: string
): Promise<void> {
    try {
        // Registra evento
        await registrarEvento(conversaId, 'link_checkout', { link })

        // Atualiza etapa do funil
        await atualizarEtapaFunil(conversaId, 'link_checkout')

        // Agenda follow-up em 6h se não finalizar
        await agendarFollowUp(conversaId, 'carrinho_abandonado', 6)

        // Recalcula pontuação
        await calcularPontuacaoLead(conversaId)
    } catch (error) {
        console.error('Erro no trigger onLinkCheckoutEnviado:', error)
    }
}

// Trigger: Conversão realizada (pedido confirmado)
export async function onConversao(
    conversaId: string,
    valorPedido: number,
    numeroPedido: string
): Promise<void> {
    try {
        // Registra evento
        await registrarEvento(conversaId, 'conversao', {
            valor: valorPedido,
            pedido: numeroPedido,
        })

        // Atualiza etapa do funil
        await db.conversaWhatsApp.update({
            where: { id: conversaId },
            data: {
                etapaFunil: 'convertido',
                valorPotencial: valorPedido,
            },
        })

        // Cancela todos os follow-ups
        await cancelarFollowUps(conversaId)

        // Agenda follow-up pós-venda em 7 dias
        await agendarFollowUp(conversaId, 'pos_venda', 24 * 7)
    } catch (error) {
        console.error('Erro no trigger onConversao:', error)
    }
}

// Trigger: Lead perdido
export async function onLeadPerdido(
    conversaId: string,
    motivo: string
): Promise<void> {
    try {
        // Registra evento
        await registrarEvento(conversaId, 'perda', { motivo })

        // Atualiza etapa do funil
        await db.conversaWhatsApp.update({
            where: { id: conversaId },
            data: {
                etapaFunil: 'perdido',
                motivoPerda: motivo,
            },
        })

        // Cancela todos os follow-ups
        await cancelarFollowUps(conversaId)
    } catch (error) {
        console.error('Erro no trigger onLeadPerdido:', error)
    }
}

// Trigger: Transferência para humano
export async function onTransferenciaHumano(
    conversaId: string,
    motivo?: string
): Promise<void> {
    try {
        // Registra evento
        await registrarEvento(conversaId, 'transferencia_humano', { motivo })

        // Atualiza modo da conversa
        await db.conversaWhatsApp.update({
            where: { id: conversaId },
            data: { modo: 'humano' },
        })

        // Cancela follow-ups automáticos
        await cancelarFollowUps(conversaId)
    } catch (error) {
        console.error('Erro no trigger onTransferenciaHumano:', error)
    }
}

// Trigger: Cliente informou veículo
export async function onVeiculoInformado(
    conversaId: string,
    veiculo: { marca?: string; modelo?: string; ano?: number; medida?: string }
): Promise<void> {
    try {
        // Atualiza dados do veículo na conversa
        const conversaAtual = await db.conversaWhatsApp.findUnique({
            where: { id: conversaId },
        })

        const veiculoAtual = (conversaAtual?.veiculoInfo as any) || {}
        const veiculoAtualizado = { ...veiculoAtual, ...veiculo }

        await db.conversaWhatsApp.update({
            where: { id: conversaId },
            data: { veiculoInfo: veiculoAtualizado },
        })

        // Registra evento de lead qualificado
        await registrarEvento(conversaId, 'lead_qualificado', veiculo)

        // Atualiza etapa do funil
        await atualizarEtapaFunil(conversaId, 'lead_qualificado')

        // Recalcula pontuação
        await calcularPontuacaoLead(conversaId)
    } catch (error) {
        console.error('Erro no trigger onVeiculoInformado:', error)
    }
}

// Trigger: Follow-up enviado
export async function onFollowUpEnviado(
    conversaId: string,
    tipo: string
): Promise<void> {
    try {
        await registrarEvento(conversaId, 'follow_up_enviado', { tipo })
    } catch (error) {
        console.error('Erro no trigger onFollowUpEnviado:', error)
    }
}
