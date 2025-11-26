import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const numero = searchParams.get('numero')

        if (!numero) {
            return NextResponse.json({ error: 'Número do pedido é obrigatório' }, { status: 400 })
        }

        // Buscar usuário para verificar lojaId
        const usuario = await db.usuario.findUnique({
            where: { id: session.userId },
            select: { lojaId: true }
        })

        if (!usuario) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Buscar pedido por número
        const pedido = await db.pedido.findFirst({
            where: {
                lojaId: usuario.lojaId,
                numero: numero
            },
            include: {
                cliente: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true,
                        email: true
                    }
                }
            }
        })

        if (!pedido) {
            return NextResponse.json({ success: false, message: 'Pedido não encontrado' })
        }

        return NextResponse.json({
            success: true,
            pedido: {
                id: pedido.id,
                numero: pedido.numero,
                total: Number(pedido.total),
                status: pedido.status,
                cliente: pedido.cliente
            }
        })
    } catch (error) {
        console.error('Erro ao buscar pedido:', error)
        return NextResponse.json({ error: 'Erro ao buscar pedido' }, { status: 500 })
    }
}
