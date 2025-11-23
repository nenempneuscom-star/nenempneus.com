import { redirect } from 'next/navigation'

export default function PedidosPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
            </div>
            <div className="p-4 border rounded-lg bg-white">
                <p className="text-muted-foreground">Funcionalidade de pedidos em desenvolvimento.</p>
            </div>
        </div>
    )
}
