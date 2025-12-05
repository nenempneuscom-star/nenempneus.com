export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { mercadoPagoPayment } from '@/lib/mercadopago'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        // Verificar se Mercado Pago está configurado
        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            return NextResponse.json(
                { success: false, error: 'Mercado Pago não configurado' },
                { status: 503 }
            )
        }

        const body = await req.json()
        const {
            pedidoNumero,
            transaction_amount,
            payer,
            description,
        } = body

        console.log('Criando PIX:', { pedidoNumero, transaction_amount })

        // Criar pagamento PIX no Mercado Pago
        const payment = await mercadoPagoPayment.create({
            body: {
                transaction_amount: Number(transaction_amount),
                payment_method_id: 'pix',
                payer: {
                    email: payer.email,
                    first_name: payer.first_name,
                    last_name: payer.last_name,
                    identification: payer.identification,
                },
                description: description || `Pedido ${pedidoNumero} - NenemPneus.com`,
                external_reference: pedidoNumero,
                notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
                statement_descriptor: 'NENEM PNEUS',
            },
        })

        console.log('PIX criado:', payment)

        // Criar registro de pagamento
        await db.pagamento.create({
            data: {
                pedido: { connect: { numero: pedidoNumero } },
                gateway: 'mercadopago',
                metodo: 'pix',
                status: payment.status || 'pending',
                valor: Number(transaction_amount),
                mpPaymentId: payment.id?.toString(),
                mpStatus: payment.status,
            },
        })

        // Extrair dados do PIX
        const pixData = payment.point_of_interaction?.transaction_data

        if (!pixData) {
            throw new Error('Dados do PIX não retornados pelo Mercado Pago')
        }

        return NextResponse.json({
            success: true,
            payment_id: payment.id,
            status: payment.status,
            pix: {
                qr_code: pixData.qr_code,
                qr_code_base64: pixData.qr_code_base64,
                ticket_url: pixData.ticket_url,
            },
            expiration_date: payment.date_of_expiration,
        })
    } catch (error: any) {
        console.error('Erro ao criar PIX:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Erro ao criar PIX',
                details: error.cause || error
            },
            { status: 500 }
        )
    }
}
