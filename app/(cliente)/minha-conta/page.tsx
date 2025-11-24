export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getClienteLogado } from '@/lib/cliente/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import {
  Package,
  Calendar,
  Car,
  Heart,
  Star,
  Ticket,
  Gift,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  pago: { label: 'Pago', variant: 'default' },
  separando: { label: 'Preparando', variant: 'outline' },
  pronto: { label: 'Pronto', variant: 'default' },
  concluido: { label: 'Concluido', variant: 'default' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
}

export default async function MinhaContaPage() {
  const cliente = await getClienteLogado()

  if (!cliente) {
    return null
  }

  // Buscar dados do dashboard
  const [ultimosPedidos, proximoAgendamento, totalFavoritos] = await Promise.all([
    prisma.pedido.findMany({
      where: { clienteId: cliente.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        items: {
          include: { produto: true },
        },
      },
    }),
    prisma.agendamento.findFirst({
      where: {
        clienteId: cliente.id,
        data: { gte: new Date() },
        status: { in: ['confirmado', 'pendente'] },
      },
      orderBy: { data: 'asc' },
      include: {
        pedido: true,
      },
    }),
    prisma.favorito.count({
      where: { clienteId: cliente.id },
    }),
  ])

  const quickActions = [
    { name: 'Meus Pedidos', href: '/minha-conta/pedidos', icon: Package, count: cliente._count.pedidos },
    { name: 'Agendamentos', href: '/minha-conta/agendamentos', icon: Calendar, count: cliente._count.agendamentos },
    { name: 'Meus Veiculos', href: '/minha-conta/veiculos', icon: Car, count: cliente.veiculos.length },
    { name: 'Favoritos', href: '/minha-conta/favoritos', icon: Heart, count: totalFavoritos },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Ola, {cliente.nome.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">
          Bem-vindo a sua area do cliente. Acompanhe seus pedidos e agendamentos.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <action.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{action.count}</p>
                    <p className="text-sm text-muted-foreground">{action.name}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pontos de Fidelidade */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-full">
              <Star className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{cliente.pontos}</p>
              <p className="text-sm text-muted-foreground">Pontos de fidelidade</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              A cada R$ 100 em compras, voce ganha 10 pontos!
            </p>
            <Link href="/minha-conta/cupons">
              <Button variant="link" className="p-0 h-auto text-primary">
                Ver como usar seus pontos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ultimo Pedido ou Proximo Agendamento */}
        {proximoAgendamento ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Proximo Agendamento
              </CardTitle>
              <CardDescription>Sua proxima visita a loja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">
                    {new Date(proximoAgendamento.data).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {new Date(proximoAgendamento.hora).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pedido #{proximoAgendamento.pedido.numero}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    <Clock className="h-3 w-3 mr-1" />
                    Confirmado
                  </Badge>
                </div>
              </div>
              <Link href="/minha-conta/agendamentos">
                <Button variant="outline" className="w-full mt-4">
                  Ver todos agendamentos
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Agendamentos
              </CardTitle>
              <CardDescription>Voce nao tem agendamentos proximos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  Faca um pedido para agendar a instalacao
                </p>
                <Link href="/catalogo">
                  <Button>Ver Catalogo</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ultimos Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Ultimos Pedidos
            </CardTitle>
            <CardDescription>Seus pedidos mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {ultimosPedidos.length > 0 ? (
              <div className="space-y-4">
                {ultimosPedidos.map((pedido) => (
                  <Link
                    key={pedido.id}
                    href={`/minha-conta/pedidos/${pedido.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Pedido #{pedido.numero}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={statusLabels[pedido.status]?.variant || 'secondary'}>
                          {statusLabels[pedido.status]?.label || pedido.status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          {formatPrice(Number(pedido.total))}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link href="/minha-conta/pedidos">
                  <Button variant="outline" className="w-full">
                    Ver todos os pedidos
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  Voce ainda nao fez nenhum pedido
                </p>
                <Link href="/catalogo">
                  <Button>Comecar a comprar</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acoes Rapidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acoes Rapidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/catalogo">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Package className="h-4 w-4" />
                Ver Catalogo
              </Button>
            </Link>
            <Link href="/minha-conta/indicar">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Gift className="h-4 w-4" />
                Indicar Amigo
              </Button>
            </Link>
            <Link href="/minha-conta/cupons">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Ticket className="h-4 w-4" />
                Meus Cupons
              </Button>
            </Link>
            <Link href="/minha-conta/avaliacoes">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Star className="h-4 w-4" />
                Avaliar Compra
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
