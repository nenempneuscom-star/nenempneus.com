export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LOJA_SLUG } from '@/lib/constants'
import { verificarDisponibilidade, getSettings } from '@/lib/agendamento'
import { parseISO } from 'date-fns'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { pedidoNumero, data, hora } = body

        console.log('[AGENDAMENTO] Dados recebidos:', { pedidoNumero, data, hora })

        if (!pedidoNumero || !data || !hora) {
            return NextResponse.json(
                { success: false, error: 'Dados incompletos: pedidoNumero, data e hora são obrigatórios' },
                { status: 400 }
            )
        }

        const dataObj = parseISO(data)
        const horaObj = new Date(`1970-01-01T${hora}:00`)

        console.log('[AGENDAMENTO] Objetos criados:', { dataObj, horaObj })

        // Verificar disponibilidade
        let disponivel = true
        try {
            disponivel = await verificarDisponibilidade(dataObj, hora)
            console.log('[AGENDAMENTO] Disponibilidade:', disponivel)
        } catch (dispError: any) {
            console.error('[AGENDAMENTO] Erro ao verificar disponibilidade:', dispError)
            // Continuar mesmo com erro na verificação
        }

        if (!disponivel) {
            return NextResponse.json(
                { success: false, error: 'Horário não disponível' },
                { status: 400 }
            )
        }

        // Buscar pedido
        console.log('[AGENDAMENTO] Buscando pedido:', pedidoNumero)
        const pedido = await db.pedido.findUnique({
            where: { numero: pedidoNumero },
            include: { cliente: true },
        })

        console.log('[AGENDAMENTO] Pedido encontrado:', pedido?.id)

        if (!pedido) {
            return NextResponse.json(
                { success: false, error: 'Pedido não encontrado' },
                { status: 404 }
            )
        }

        // Verificar se já existe agendamento para este pedido
        const agendamentoExistente = await db.agendamento.findUnique({
            where: { pedidoId: pedido.id },
        })

        if (agendamentoExistente) {
            console.log('[AGENDAMENTO] Agendamento já existe para este pedido, atualizando...')
            // Atualizar agendamento existente
            const agendamentoAtualizado = await db.agendamento.update({
                where: { pedidoId: pedido.id },
                data: {
                    data: dataObj,
                    hora: horaObj,
                    status: 'confirmado',
                },
            })
            return NextResponse.json({ success: true, agendamento: agendamentoAtualizado })
        }

        // Verificar se já existe agendamento no mesmo slot considerando clientesPorSlot
        const settings = await getSettings()
        const agendamentosNoSlot = await db.agendamento.count({
            where: {
                lojaId: pedido.lojaId,
                data: dataObj,
                hora: horaObj,
                status: {
                    in: ['confirmado', 'em_andamento'],
                },
            },
        })

        if (agendamentosNoSlot >= settings.clientesPorSlot) {
            console.log('[AGENDAMENTO] Slot lotado:', agendamentosNoSlot, '/', settings.clientesPorSlot)
            return NextResponse.json(
                { success: false, error: 'Este horário já está ocupado. Por favor, escolha outro horário.' },
                { status: 400 }
            )
        }

        // Criar agendamento
        console.log('[AGENDAMENTO] Criando novo agendamento...')
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

        console.log('[AGENDAMENTO] Agendamento criado:', agendamento.id)

        // Atualizar pedido
        await db.pedido.update({
            where: { id: pedido.id },
            data: { temAgendamento: true },
        })

        console.log('[AGENDAMENTO] Pedido atualizado com temAgendamento: true')

        return NextResponse.json({ success: true, agendamento })
    } catch (error: any) {
        console.error('[AGENDAMENTO] Erro completo:', error)
        console.error('[AGENDAMENTO] Stack:', error.stack)
        return NextResponse.json(
            { success: false, error: error.message || 'Erro interno ao criar agendamento' },
            { status: 500 }
        )
    }
}
