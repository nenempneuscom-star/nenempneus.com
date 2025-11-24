import Link from 'next/link'
import { getClienteLogado } from '@/lib/cliente/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, MapPin, Package, CalendarX } from 'lucide-react'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  confirmado: { label: 'Confirmado', variant: 'default' },
  realizado: { label: 'Realizado', variant: 'default' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
}

export default async function AgendamentosClientePage() {
  const cliente = await getClienteLogado()

  if (!cliente) {
    return null
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [agendamentosProximos, agendamentosPassados] = await Promise.all([
    prisma.agendamento.findMany({
      where: {
        clienteId: cliente.id,
        data: { gte: hoje },
        status: { in: ['pendente', 'confirmado'] },
      },
      orderBy: { data: 'asc' },
      include: {
        pedido: {
          include: {
            items: { include: { produto: true } },
          },
        },
        loja: true,
      },
    }),
    prisma.agendamento.findMany({
      where: {
        clienteId: cliente.id,
        OR: [
          { data: { lt: hoje } },
          { status: { in: ['realizado', 'cancelado'] } },
        ],
      },
      orderBy: { data: 'desc' },
      take: 10,
      include: {
        pedido: {
          include: {
            items: { include: { produto: true } },
          },
        },
        loja: true,
      },
    }),
  ])

  const AgendamentoCard = ({ agendamento }: { agendamento: any }) => {
    const config = statusConfig[agendamento.status] || statusConfig.pendente
    const totalItens = agendamento.pedido.items.reduce((acc: number, item: any) => acc + item.quantidade, 0)

    return (
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Data e Hora */}
            <div className="sm:w-32 text-center p-4 bg-primary/10 rounded-lg shrink-0">
              <p className="text-sm text-muted-foreground">
                {new Date(agendamento.data).toLocaleDateString('pt-BR', {
                  weekday: 'short',
                })}
              </p>
              <p className="text-3xl font-bold text-primary">
                {new Date(agendamento.data).getDate()}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(agendamento.data).toLocaleDateString('pt-BR', {
                  month: 'short',
                })}
              </p>
              <p className="text-lg font-semibold mt-2">
                {new Date(agendamento.hora).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={config.variant}>{config.label}</Badge>
                <span className="text-sm text-muted-foreground">
                  Pedido #{agendamento.pedido.numero}
                </span>
              </div>

              <h3 className="font-semibold mb-2">Instalacao de Pneus</h3>

              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>{totalItens} {totalItens === 1 ? 'pneu' : 'pneus'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{agendamento.loja.nome} - {agendamento.loja.cidade}</span>
                </div>
              </div>

              {agendamento.observacoes && (
                <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                  Obs: {agendamento.observacoes}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <Link href={`/minha-conta/pedidos/${agendamento.pedido.id}`}>
                  <Button variant="outline" size="sm">
                    Ver Pedido
                  </Button>
                </Link>
                {agendamento.status === 'confirmado' && (
                  <Link
                    href={`https://wa.me/${agendamento.loja.whatsapp?.replace(/\D/g, '')}?text=Ola! Tenho um agendamento para ${new Date(agendamento.data).toLocaleDateString('pt-BR')} as ${new Date(agendamento.hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                    target="_blank"
                  >
                    <Button variant="outline" size="sm">
                      Falar com a Loja
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Agendamentos</h1>
        <p className="text-muted-foreground">
          Acompanhe suas visitas agendadas para instalacao de pneus
        </p>
      </div>

      <Tabs defaultValue="proximos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="proximos" className="gap-2">
            <Calendar className="h-4 w-4" />
            Proximos ({agendamentosProximos.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <Clock className="h-4 w-4" />
            Historico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proximos" className="space-y-4">
          {agendamentosProximos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <CalendarX className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum agendamento proximo</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Voce nao tem nenhuma visita agendada. Faca um pedido para agendar a instalacao!
                </p>
                <Link href="/catalogo">
                  <Button>Ver Catalogo</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            agendamentosProximos.map((agendamento) => (
              <AgendamentoCard key={agendamento.id} agendamento={agendamento} />
            ))
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          {agendamentosPassados.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Clock className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sem historico</h3>
                <p className="text-muted-foreground text-center">
                  Voce ainda nao realizou nenhum agendamento
                </p>
              </CardContent>
            </Card>
          ) : (
            agendamentosPassados.map((agendamento) => (
              <AgendamentoCard key={agendamento.id} agendamento={agendamento} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
