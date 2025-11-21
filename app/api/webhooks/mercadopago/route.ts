import { NextRequest, NextResponse } from 'next/server'
import { mercadoPagoPayment } from '@/lib/mercadopago'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        console.log('Webhook MP recebido:', body)

        // Verificar tipo de notificação
        if (body.type !== 'payment') {
            return NextResponse.json({ success: true })
        }

        const paymentId = body.data.id

        // Buscar dados do pagamento
        const payment = await mercadoPagoPayment.get({ id: paymentId })

        console.log('Payment data:', payment)

        const pedidoNumero = payment.external_reference

        if (!pedidoNumero) {
            console.error('Pedido não encontrado no external_reference')
            return NextResponse.json({ success: false })
        }

        // Atualizar pedido
        await db.pedido.update({
            where: { numero: pedidoNumero },
            data: {
                status: payment.status === 'approved' ? 'pago' : 'pendente',
            },
        })

        // Criar registro de pagamento
        await db.pagamento.create({
            data: {
                pedido: {
                    connect: { numero: pedidoNumero },
                },
                gateway: 'mercadopago',
                metodo: payment.payment_type_id || 'unknown',
                status: payment.status || 'pending',
                valor: payment.transaction_amount || 0,
                mpPaymentId: payment.id?.toString(),
                mpStatus: payment.status,
            },
        })

        console.log('Pedido atualizado:', pedidoNumero, payment.status)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Erro no webhook MP:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
