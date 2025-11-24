import Link from 'next/link'
import { getClienteLogado } from '@/lib/cliente/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { Package, ChevronRight, Calendar, ShoppingBag } from 'lucide-react'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string }> = {
  pendente: { label: 'Aguardando Pagamento', variant: 'secondary', color: 'bg-yellow-500' },
  pago: { label: 'Pago', variant: 'default', color: 'bg-green-500' },
  separando: { label: 'Preparando', variant: 'outline', color: 'bg-blue-500' },
  pronto: { label: 'Pronto para Retirada', variant: 'default', color: 'bg-purple-500' },
  concluido: { label: 'Concluido', variant: 'default', color: 'bg-green-600' },
  cancelado: { label: 'Cancelado', variant: 'destructive', color: 'bg-red-500' },
}

export default async function MeusPedidosPage() {
  const cliente = await getClienteLogado()

  if (!cliente) {
    return null
  }

  const pedidos = await prisma.pedido.findMany({
    where: { clienteId: cliente.id },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: { produto: true },
      },
      agendamento: true,
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Meus Pedidos</h1>
        <p className="text-muted-foreground">
          Acompanhe o status de todos os seus pedidos
        </p>
      </div>

      {pedidos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-muted rounded-full mb-4">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum pedido ainda</h3>
            <p className="text-muted-foreground text-center mb-6">
              Voce ainda nao fez nenhum pedido. Que tal dar uma olhada no nosso catalogo?
            </p>
            <Link href="/catalogo">
              <Button>Ver Catalogo</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const config = statusConfig[pedido.status] || statusConfig.pendente
            const totalItens = pedido.items.reduce((acc, item) => acc + item.quantidade, 0)

            return (
              <Link key={pedido.id} href={`/minha-conta/pedidos/${pedido.id}`}>
                <Card className="hover:border-primary/50 transition-all hover:shadow-md cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Info Principal */}
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">Pedido #{pedido.numero}</h3>
                            <Badge variant={config.variant}>{config.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(pedido.createdAt).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {totalItens} {totalItens === 1 ? 'item' : 'itens'}
                          </p>
                        </div>
                      </div>

                      {/* Valor e Acao */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {formatPrice(Number(pedido.total))}
                          </p>
                          {pedido.agendamento && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Agendado:{' '}
                                {new Date(pedido.agendamento.data).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Timeline Mini */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 overflow-x-auto">
                        {['pendente', 'pago', 'separando', 'pronto', 'concluido'].map((step, index) => {
                          const stepConfig = statusConfig[step]
                          const isActive = step === pedido.status
                          const isPast = ['pendente', 'pago', 'separando', 'pronto', 'concluido'].indexOf(pedido.status) >= index
                          const isCanceled = pedido.status === 'cancelado'

                          return (
                            <div key={step} className="flex items-center">
                              <div
                                className={`w-3 h-3 rounded-full shrink-0 ${
                                  isCanceled
                                    ? 'bg-muted'
                                    : isPast
                                    ? stepConfig.color
                                    : 'bg-muted'
                                } ${isActive ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                              />
                              {index < 4 && (
                                <div
                                  className={`w-8 h-0.5 ${
                                    isCanceled
                                      ? 'bg-muted'
                                      : isPast && index < ['pendente', 'pago', 'separando', 'pronto', 'concluido'].indexOf(pedido.status)
                                      ? statusConfig[['pendente', 'pago', 'separando', 'pronto', 'concluido'][index + 1]].color
                                      : 'bg-muted'
                                  }`}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
