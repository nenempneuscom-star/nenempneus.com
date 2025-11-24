export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { mercadoPagoPreference } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
    try {
        // Verificar se Mercado Pago está configurado
        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            return NextResponse.json(
                { success: false, error: 'Mercado Pago não configurado. Entre em contato com o suporte.' },
                { status: 503 }
            )
        }
        const body = await req.json()
        const { pedidoId, items, total } = body

        const preference = await mercadoPagoPreference.create({
            body: {
                items: items.map((item: any) => ({
                    id: item.id,
                    title: item.nome,
                    quantity: item.quantidade,
                    unit_price: item.preco,
                })),
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_BASE_URL}/pedido/${pedidoId}/sucesso`,
                    failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pedido/${pedidoId}/falha`,
                    pending: `${process.env.NEXT_PUBLIC_BASE_URL}/pedido/${pedidoId}/pendente`,
                },
                auto_return: 'approved',
                notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
                external_reference: pedidoId,
                statement_descriptor: 'NENEM PNEUS',
            },
        })

        return NextResponse.json({
            success: true,
            preferenceId: preference.id,
            initPoint: preference.init_point,
        })
    } catch (error: any) {
        console.error('Erro ao criar preferência MP:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
