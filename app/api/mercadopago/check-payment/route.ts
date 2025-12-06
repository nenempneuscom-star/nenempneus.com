export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { mercadoPagoPayment } from '@/lib/mercadopago'
import { db } from '@/lib/db'
import { enviarEmailConfirmacaoPedido } from '@/lib/email'

// Verificar status do pagamento diretamente no Mercado Pago
export async function POST(req: NextRequest) {
    try {
        const { pedidoNumero } = await req.json()

        if (!pedidoNumero) {
            return NextResponse.json(
                { success: false, error: 'Número do pedido obrigatório' },
                { status: 400 }
            )
        }

        console.log('[CHECK-PAYMENT] Verificando pedido:', pedidoNumero)

        // Buscar pagamento no banco
        const pagamento = await db.pagamento.findFirst({
            where: {
                pedido: { numero: pedidoNumero },
                gateway: 'mercadopago'
            },
            orderBy: { createdAt: 'desc' }
        })

        if (!pagamento?.mpPaymentId) {
            return NextResponse.json(
                { success: false, error: 'Pagamento não encontrado' },
                { status: 404 }
            )
        }

        console.log('[CHECK-PAYMENT] Payment ID:', pagamento.mpPaymentId)

        // Consultar status no Mercado Pago
        const payment = await mercadoPagoPayment.get({ id: pagamento.mpPaymentId })

        console.log('[CHECK-PAYMENT] Status MP:', payment.status)

        // Se aprovado, atualizar pedido
        if (payment.status === 'approved') {
            // Atualizar pagamento
            await db.pagamento.update({
                where: { id: pagamento.id },
                data: {
                    status: 'approved',
                    mpStatus: 'approved'
                }
            })

            // Atualizar pedido
            const pedidoAtualizado = await db.pedido.update({
                where: { numero: pedidoNumero },
                data: { status: 'pago' },
                include: {
                    cliente: true,
                    items: { include: { produto: true } },
                    agendamento: true
                }
            })

            console.log('[CHECK-PAYMENT] Pedido atualizado para PAGO')

            // Enviar email de confirmação
            if (pedidoAtualizado.cliente.email) {
                try {
                    const agendamentoFormatado = pedidoAtualizado.agendamento ? {
                        data: new Date(pedidoAtualizado.agendamento.data).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long'
                        }),
                        hora: new Date(pedidoAtualizado.agendamento.hora).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    } : undefined

                    await enviarEmailConfirmacaoPedido({
                        numero: pedidoAtualizado.numero,
                        cliente: {
                            nome: pedidoAtualizado.cliente.nome,
                            email: pedidoAtualizado.cliente.email,
                            telefone: pedidoAtualizado.cliente.telefone || undefined
                        },
                        items: pedidoAtualizado.items.map(item => ({
                            nome: item.produto.nome,
                            quantidade: item.quantidade,
                            precoUnit: Number(item.precoUnit),
                            subtotal: Number(item.subtotal),
                            imagemUrl: item.produto.imagemUrl || undefined
                        })),
                        subtotal: Number(pedidoAtualizado.subtotal),
                        desconto: Number(pedidoAtualizado.desconto),
                        total: Number(pedidoAtualizado.total),
                        agendamento: agendamentoFormatado,
                        createdAt: pedidoAtualizado.createdAt
                    })
                    console.log('[CHECK-PAYMENT] Email enviado')
                } catch (emailError) {
                    console.error('[CHECK-PAYMENT] Erro ao enviar email:', emailError)
                }
            }

            return NextResponse.json({
                success: true,
                status: 'pago',
                mpStatus: payment.status
            })
        }

        return NextResponse.json({
            success: true,
            status: 'pendente',
            mpStatus: payment.status
        })

    } catch (error: any) {
        console.error('[CHECK-PAYMENT] Erro:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
