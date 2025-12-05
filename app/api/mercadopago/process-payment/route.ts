export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { mercadoPagoPayment } from '@/lib/mercadopago'
import { db } from '@/lib/db'
import { enviarEmailConfirmacaoPedido } from '@/lib/email'

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
            payment_method_id,
            token,
            installments,
            issuer_id,
            payer,
            description,
        } = body

        console.log('Processando pagamento:', { pedidoNumero, payment_method_id, transaction_amount })

        // Criar pagamento no Mercado Pago
        const paymentData: any = {
            transaction_amount: Number(transaction_amount),
            payment_method_id,
            payer: {
                email: payer.email,
                identification: payer.identification,
            },
            description: description || `Pedido ${pedidoNumero} - NenemPneus.com`,
            external_reference: pedidoNumero,
            notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
            statement_descriptor: 'NENEM PNEUS',
        }

        // Adicionar token para pagamentos com cartão
        if (token) {
            paymentData.token = token
            paymentData.installments = installments || 1
            if (issuer_id) {
                paymentData.issuer_id = issuer_id
            }
        }

        const payment = await mercadoPagoPayment.create({ body: paymentData })

        console.log('Pagamento criado:', payment)

        // Atualizar status do pedido baseado no resultado
        let pedidoStatus = 'pendente'
        if (payment.status === 'approved') {
            pedidoStatus = 'pago'
        } else if (payment.status === 'rejected') {
            pedidoStatus = 'cancelado'
        }

        // Atualizar pedido e buscar dados completos
        const pedidoAtualizado = await db.pedido.update({
            where: { numero: pedidoNumero },
            data: { status: pedidoStatus },
            include: {
                cliente: true,
                items: {
                    include: {
                        produto: true
                    }
                },
                agendamento: true
            }
        })

        // Criar registro de pagamento
        await db.pagamento.create({
            data: {
                pedido: { connect: { numero: pedidoNumero } },
                gateway: 'mercadopago',
                metodo: payment_method_id,
                status: payment.status || 'pending',
                valor: Number(transaction_amount),
                mpPaymentId: payment.id?.toString(),
                mpStatus: payment.status,
            },
        })

        // Enviar email de confirmação quando pagamento aprovado
        if (payment.status === 'approved' && pedidoAtualizado.cliente.email) {
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

                console.log('Email de confirmação enviado para:', pedidoAtualizado.cliente.email)
            } catch (emailError) {
                console.error('Erro ao enviar email de confirmação:', emailError)
                // Não falha o pagamento se o email falhar
            }
        }

        // Retornar resposta baseada no status
        if (payment.status === 'approved') {
            return NextResponse.json({
                success: true,
                status: 'approved',
                payment_id: payment.id,
                status_detail: payment.status_detail,
            })
        } else if (payment.status === 'in_process' || payment.status === 'pending') {
            return NextResponse.json({
                success: true,
                status: payment.status,
                payment_id: payment.id,
                status_detail: payment.status_detail,
            })
        } else {
            return NextResponse.json({
                success: false,
                status: payment.status,
                status_detail: payment.status_detail,
                error: getErrorMessage(payment.status_detail || ''),
            })
        }
    } catch (error: any) {
        console.error('Erro ao processar pagamento:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Erro ao processar pagamento',
                details: error.cause || error
            },
            { status: 500 }
        )
    }
}

function getErrorMessage(statusDetail: string): string {
    const messages: Record<string, string> = {
        'cc_rejected_bad_filled_card_number': 'Número do cartão inválido',
        'cc_rejected_bad_filled_date': 'Data de validade inválida',
        'cc_rejected_bad_filled_other': 'Dados do cartão inválidos',
        'cc_rejected_bad_filled_security_code': 'Código de segurança inválido',
        'cc_rejected_blacklist': 'Cartão não permitido',
        'cc_rejected_call_for_authorize': 'Ligue para sua operadora para autorizar',
        'cc_rejected_card_disabled': 'Cartão desabilitado',
        'cc_rejected_card_error': 'Erro no cartão',
        'cc_rejected_duplicated_payment': 'Pagamento duplicado',
        'cc_rejected_high_risk': 'Pagamento recusado por segurança',
        'cc_rejected_insufficient_amount': 'Saldo insuficiente',
        'cc_rejected_invalid_installments': 'Parcelamento inválido',
        'cc_rejected_max_attempts': 'Muitas tentativas',
        'cc_rejected_other_reason': 'Pagamento recusado',
    }
    return messages[statusDetail] || 'Pagamento não aprovado. Tente outro cartão.'
}
