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
        const query = searchParams.get('q')

        if (!query) {
            return NextResponse.json({ error: 'Query de busca é obrigatória' }, { status: 400 })
        }

        // Buscar usuário para verificar lojaId
        const usuario = await db.usuario.findUnique({
            where: { id: session.userId },
            select: { lojaId: true }
        })

        if (!usuario) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Buscar cliente por nome, telefone ou email
        const cliente = await db.cliente.findFirst({
            where: {
                lojaId: usuario.lojaId,
                OR: [
                    { nome: { contains: query, mode: 'insensitive' } },
                    { telefone: { contains: query } },
                    { email: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                nome: true,
                telefone: true,
                email: true,
                veiculoMarca: true,
                veiculoModelo: true,
                veiculoPlaca: true
            }
        })

        if (!cliente) {
            return NextResponse.json({ success: false, message: 'Cliente não encontrado' })
        }

        return NextResponse.json({ success: true, cliente })
    } catch (error) {
        console.error('Erro ao buscar cliente:', error)
        return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 })
    }
}
