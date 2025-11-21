import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LOJA_SLUG } from '@/lib/constants'
import { verificarDisponibilidade } from '@/lib/agendamento'
import { parseISO } from 'date-fns'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { pedidoNumero, data, hora } = body

        const dataObj = parseISO(data)
        const horaObj = new Date(`1970-01-01T${hora}:00`)

        // Verificar disponibilidade
        const disponivel = await verificarDisponibilidade(dataObj, hora)

        if (!disponivel) {
            return NextResponse.json(
                { success: false, error: 'Horário não disponível' },
                { status: 400 }
            )
        }

        // Buscar pedido
        const pedido = await db.pedido.findUnique({
            where: { numero: pedidoNumero },
            include: { cliente: true },
        })

        if (!pedido) {
            return NextResponse.json(
                { success: false, error: 'Pedido não encontrado' },
                { status: 404 }
            )
        }

        // Criar agendamento
        const agendamento = await db.agendamento.create({
            data: {
                lojaId: pedido.lojaId,
                pedidoId: pedido.id,
                clienteId: pedido.clienteId,
                data: dataObj,
                hora: horaObj,
                status: 'confirmado',
            },
        })

        // Atualizar pedido
        await db.pedido.update({
            where: { id: pedido.id },
            data: { temAgendamento: true },
        })

        return NextResponse.json({ success: true, agendamento })
    } catch (error: any) {
        console.error('Erro ao criar agendamento:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
