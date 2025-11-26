import { NextRequest, NextResponse } from 'next/server'
import { mercadoPagoPayment } from '@/lib/mercadopago'
import { db } from '@/lib/db'
import crypto from 'crypto'

function validateWebhookSignature(req: NextRequest, body: any): boolean {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    if (!secret) {
        console.warn('MERCADOPAGO_WEBHOOK_SECRET não configurado')
        return true // Permite passar se não configurado (desenvolvimento)
    }

    // Extrair headers da assinatura
    const xSignature = req.headers.get('x-signature')
    const xRequestId = req.headers.get('x-request-id')

    if (!xSignature || !xRequestId) {
        console.error('Headers de assinatura ausentes')
        return false
    }

    // Parse da assinatura: ts=timestamp,v1=hash
    const parts = xSignature.split(',')
    const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1]
    const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1]

    if (!ts || !hash) {
        console.error('Formato de assinatura inválido')
        return false
    }

    // Criar string de manifesto: id;request-id;ts
    const dataId = body?.data?.id || body?.id
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

    // Calcular HMAC SHA256
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(manifest)
    const computedHash = hmac.digest('hex')

    // Comparar hashes
    const isValid = computedHash === hash

    if (!isValid) {
        console.error('Assinatura inválida:', { computedHash, receivedHash: hash })
    }

    return isValid
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        console.log('Webhook MP recebido:', body)

        // Validar assinatura
        if (!validateWebhookSignature(req, body)) {
            console.error('Webhook rejeitado: assinatura inválida')
            return NextResponse.json(
                { success: false, error: 'Invalid signature' },
                { status: 401 }
            )
        }

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
