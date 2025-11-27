// Script para sincronizar pagamento manualmente
// Execute: npx ts-node scripts/sync-payment.ts <PAYMENT_ID>

import { mercadoPagoPayment } from '../lib/mercadopago'
import { db } from '../lib/db'

async function syncPayment(paymentId: string) {
    try {
        console.log('Buscando pagamento:', paymentId)

        const payment = await mercadoPagoPayment.get({ id: paymentId })

        console.log('Status do pagamento:', payment.status)
        console.log('External reference:', payment.external_reference)

        if (!payment.external_reference) {
            console.error('Pagamento não tem external_reference')
            return
        }

        // Atualizar pedido
        const pedido = await db.pedido.update({
            where: { numero: payment.external_reference },
            data: {
                status: payment.status === 'approved' ? 'pago' : 'pendente',
            },
        })

        console.log('Pedido atualizado:', pedido.numero, '→', pedido.status)

        // Criar registro de pagamento se não existir
        const pagamentoExistente = await db.pagamento.findFirst({
            where: { mpPaymentId: payment.id?.toString() }
        })

        if (!pagamentoExistente) {
            await db.pagamento.create({
                data: {
                    pedido: { connect: { numero: payment.external_reference } },
                    gateway: 'mercadopago',
                    metodo: payment.payment_type_id || 'pix',
                    status: payment.status || 'pending',
                    valor: payment.transaction_amount || 0,
                    mpPaymentId: payment.id?.toString(),
                    mpStatus: payment.status,
                },
            })
            console.log('Registro de pagamento criado')
        }

        console.log('✅ Sincronização concluída!')
    } catch (error) {
        console.error('❌ Erro:', error)
    }
}

const paymentId = process.argv[2]
if (!paymentId) {
    console.error('❌ Uso: npx ts-node scripts/sync-payment.ts <PAYMENT_ID>')
    process.exit(1)
}

syncPayment(paymentId)
