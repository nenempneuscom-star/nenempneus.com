import { db } from '../db'
import { LOJA_SLUG } from '../constants'

export async function salvarMensagemRecebida(
    telefone: string,
    nomeContato: string,
    conteudo: string,
    waMessageId: string
) {
    try {
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) {
            throw new Error('Loja não encontrada')
        }

        // Buscar ou criar conversa
        let conversa = await db.conversaWhatsApp.findUnique({
            where: {
                lojaId_telefone: {
                    lojaId: loja.id,
                    telefone: telefone,
                },
            },
        })

        if (!conversa) {
            conversa = await db.conversaWhatsApp.create({
                data: {
                    lojaId: loja.id,
                    telefone,
                    nomeContato,
                    status: 'ativa',
                    modo: 'bot',
                },
            })
        }

        // Salvar mensagem
        const mensagem = await db.mensagemWhatsApp.create({
            data: {
                conversaId: conversa.id,
                direcao: 'entrada',
                remetente: telefone,
                conteudo,
                waMessageId,
            },
        })

        // Atualizar conversa
        await db.conversaWhatsApp.update({
            where: { id: conversa.id },
            data: {
                totalMensagens: { increment: 1 },
                ultimaMensagemEm: new Date(),
            },
        })

        return { conversa, mensagem }
    } catch (error) {
        console.error('Erro ao salvar mensagem:', error)
        throw error
    }
}

export async function salvarMensagemEnviada(
    conversaId: string,
    conteudo: string,
    waMessageId?: string
) {
    try {
        const mensagem = await db.mensagemWhatsApp.create({
            data: {
                conversaId,
                direcao: 'saida',
                conteudo,
                waMessageId,
            },
        })

        // Atualizar conversa
        await db.conversaWhatsApp.update({
            where: { id: conversaId },
            data: {
                totalMensagens: { increment: 1 },
                ultimaMensagemEm: new Date(),
            },
        })

        return mensagem
    } catch (error) {
        console.error('Erro ao salvar mensagem enviada:', error)
        throw error
    }
}
