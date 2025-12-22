import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH - Alterar modo da conversa (bot/humano)
export async function PATCH(req: NextRequest) {
    try {
        const { conversaId, modo } = await req.json()

        if (!conversaId) {
            return NextResponse.json(
                { error: 'conversaId é obrigatório' },
                { status: 400 }
            )
        }

        if (!modo || !['bot', 'humano'].includes(modo)) {
            return NextResponse.json(
                { error: 'modo deve ser "bot" ou "humano"' },
                { status: 400 }
            )
        }

        const conversa = await db.conversaWhatsApp.update({
            where: { id: conversaId },
            data: { modo },
        })

        console.log(`🔄 Modo da conversa ${conversaId} alterado para: ${modo}`)

        return NextResponse.json({
            success: true,
            conversa: {
                id: conversa.id,
                modo: conversa.modo,
            },
        })
    } catch (error: any) {
        console.error('Erro ao alterar modo da conversa:', error)
        return NextResponse.json(
            { error: 'Erro ao alterar modo da conversa' },
            { status: 500 }
        )
    }
}
