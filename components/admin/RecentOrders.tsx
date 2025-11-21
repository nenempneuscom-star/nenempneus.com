import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'

interface RecentOrdersProps {
  pedidos: any[]
}

export function RecentOrders({ pedidos }: RecentOrdersProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-500'
      case 'pendente':
        return 'bg-yellow-500'
      case 'cancelado':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Pedidos Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pedidos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum pedido ainda
            </p>
          ) : (
            pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {pedido.cliente.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pedido #{pedido.numero}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(pedido.createdAt)}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-bold">
                    {formatPrice(Number(pedido.total))}
                  </p>
                  <Badge className={getStatusColor(pedido.status)}>
                    {pedido.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
