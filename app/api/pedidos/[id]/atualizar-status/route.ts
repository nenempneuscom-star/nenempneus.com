import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { status } = await req.json()

        // Atualizar pedido
        const pedido = await db.pedido.update({
            where: { numero: id },
            data: { status },
        })

        return NextResponse.json({ success: true, pedido })
    } catch (error: any) {
        console.error('Erro ao atualizar status:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
