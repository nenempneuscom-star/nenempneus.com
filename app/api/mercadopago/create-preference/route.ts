export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { mercadoPagoPreference } from '@/lib/mercadopago'
import { db } from '@/lib/db'
import { gerarDescricaoGeometria, gerarDescricaoBalanceamento } from '@/lib/store/carrinho-store'

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
        const { pedidoId, items, servicos = [], total, payer, deviceId } = body

        // Criar array de items incluindo pneus e serviços
        const mpItems = [
            // Pneus
            ...items.map((item: any) => ({
                id: item.id,
                title: item.nome,
                description: `Pneu ${item.specs?.marca || ''} ${item.specs?.modelo || ''} - ${item.specs?.largura}/${item.specs?.perfil}R${item.specs?.aro}`.trim(),
                category_id: 'vehicles',
                quantity: item.quantidade,
                unit_price: item.preco,
            })),
            // Serviços adicionais
            ...servicos.map((servico: any) => {
                const descricao = servico.id === 'geometria'
                    ? gerarDescricaoGeometria(servico.config)
                    : gerarDescricaoBalanceamento(servico.config)

                return {
                    id: servico.id,
                    title: descricao,
                    description: descricao,
                    category_id: 'services',
                    quantity: 1,
                    unit_price: servico.preco,
                }
            }),
        ]

        const preference = await mercadoPagoPreference.create({
            body: {
                items: mpItems,
                payer: payer ? {
                    name: payer.name,
                    surname: payer.surname,
                    email: payer.email,
                    phone: payer.phone,
                    identification: payer.identification,
                    address: payer.address,
                } : undefined,
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_BASE_URL}/pedido/${pedidoId}/sucesso`,
                    failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pedido/${pedidoId}/falha`,
                    pending: `${process.env.NEXT_PUBLIC_BASE_URL}/pedido/${pedidoId}/pendente`,
                },
                auto_return: 'approved',
                notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
                external_reference: pedidoId,
                statement_descriptor: 'NENEM PNEUS',
                metadata: deviceId ? {
                    device_id: deviceId
                } : undefined,
            },
        })

        // Salvar preference no banco de dados
        await db.pagamento.create({
            data: {
                pedido: { connect: { numero: pedidoId } },
                gateway: 'mercadopago',
                metodo: 'preference',
                status: 'pending',
                valor: total,
                mpPreferenceId: preference.id,
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
