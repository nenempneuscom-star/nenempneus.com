import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// PUT - Atualizar agendamento
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = await params
        const { data, hora, status, observacoes } = await request.json()

        // Buscar usuário para verificar lojaId
        const usuario = await db.usuario.findUnique({
            where: { id: session.userId },
            select: { lojaId: true }
        })

        if (!usuario) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Verificar se o agendamento pertence à loja do usuário
        const agendamento = await db.agendamento.findFirst({
            where: {
                id,
                lojaId: usuario.lojaId
            }
        })

        if (!agendamento) {
            return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
        }

        // Atualizar agendamento
        const agendamentoAtualizado = await db.agendamento.update({
            where: { id },
            data: {
                data: new Date(data),
                hora: new Date(`1970-01-01T${hora}:00`),
                status,
                observacoes: observacoes || null,
                updatedAt: new Date()
            }
        })

        return NextResponse.json(agendamentoAtualizado)
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error)
        return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 })
    }
}

// DELETE - Cancelar agendamento
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = await params

        // Buscar usuário para verificar lojaId
        const usuario = await db.usuario.findUnique({
            where: { id: session.userId },
            select: { lojaId: true }
        })

        if (!usuario) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Verificar se o agendamento pertence à loja do usuário
        const agendamento = await db.agendamento.findFirst({
            where: {
                id,
                lojaId: usuario.lojaId
            }
        })

        if (!agendamento) {
            return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
        }

        // Cancelar agendamento (atualizar status ao invés de deletar)
        const agendamentoCancelado = await db.agendamento.update({
            where: { id },
            data: {
                status: 'cancelado',
                updatedAt: new Date()
            }
        })

        return NextResponse.json(agendamentoCancelado)
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error)
        return NextResponse.json({ error: 'Erro ao cancelar agendamento' }, { status: 500 })
    }
}
