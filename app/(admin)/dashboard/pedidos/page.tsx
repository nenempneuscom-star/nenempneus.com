import { getPedidos } from '@/lib/admin/pedidos'
import { PedidosClient } from '@/components/admin/pedidos/PedidosClient'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: Promise<{
        status?: string
        search?: string
        page?: string
    }>
}

export default async function PedidosPage({ searchParams }: PageProps) {
    const params = await searchParams
    const page = Number(params.page) || 1
    const limit = 10

    const { pedidos, total, pages } = await getPedidos({
        status: params.status,
        search: params.search,
        page,
        limit,
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
            </div>
            <PedidosClient
                initialPedidos={pedidos}
                total={total}
                pages={pages}
            />
        </div>
    )
}
