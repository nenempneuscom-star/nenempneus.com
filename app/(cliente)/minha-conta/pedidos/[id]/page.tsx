export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClienteLogado } from '@/lib/cliente/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  Truck,
  Home,
  QrCode,
} from 'lucide-react'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: any }> = {
  pendente: { label: 'Aguardando Pagamento', variant: 'secondary', icon: Clock },
  pago: { label: 'Pago', variant: 'default', icon: CheckCircle },
  separando: { label: 'Preparando Pedido', variant: 'outline', icon: Package },
  pronto: { label: 'Pronto para Retirada', variant: 'default', icon: Home },
  concluido: { label: 'Concluido', variant: 'default', icon: CheckCircle },
  cancelado: { label: 'Cancelado', variant: 'destructive', icon: Clock },
}

const timelineSteps = [
  { key: 'pendente', label: 'Pedido Realizado', icon: Package },
  { key: 'pago', label: 'Pagamento Confirmado', icon: CreditCard },
  { key: 'separando', label: 'Preparando', icon: Truck },
  { key: 'pronto', label: 'Pronto', icon: Home },
  { key: 'concluido', label: 'Concluido', icon: CheckCircle },
]

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PedidoDetalhesPage({ params }: PageProps) {
  const { id } = await params
  const cliente = await getClienteLogado()

  if (!cliente) {
    return null
  }

  const pedido = await prisma.pedido.findFirst({
    where: {
      id,
      clienteId: cliente.id,
    },
    include: {
      items: {
        include: { produto: true },
      },
      agendamento: true,
      pagamentos: true,
      loja: true,
    },
  })

  if (!pedido) {
    notFound()
  }

  const config = statusConfig[pedido.status] || statusConfig.pendente
  const StatusIcon = config.icon
  const currentStepIndex = timelineSteps.findIndex((s) => s.key === pedido.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/minha-conta/pedidos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Pedido #{pedido.numero}</h1>
            <Badge variant={config.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Realizado em{' '}
            {new Date(pedido.createdAt).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Timeline */}
      {pedido.status !== 'cancelado' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acompanhamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
              <div className="space-y-6">
                {timelineSteps.map((step, index) => {
                  const StepIcon = step.icon
                  const isCompleted = index <= currentStepIndex
                  const isCurrent = index === currentStepIndex

                  return (
                    <div key={step.key} className="relative flex items-center gap-4">
                      <div
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                          isCompleted
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-background border-muted'
                        } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                      >
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`font-medium ${isCompleted ? '' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-primary">Status atual</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Itens do Pedido */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pedido.items.map((item) => {
                const specs = item.produto.specs as any

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
                  >
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <span className="text-2xl font-bold text-primary">
                        {specs?.aro || '?'}"
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.produto.nome}</h4>
                      <p className="text-sm text-muted-foreground">
                        {specs?.largura}/{specs?.perfil}R{specs?.aro} - {specs?.marca}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {item.quantidade}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(Number(item.precoUnit))}</p>
                      <p className="text-sm text-muted-foreground">
                        Subtotal: {formatPrice(Number(item.subtotal))}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <Separator className="my-4" />

            {/* Totais */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(Number(pedido.subtotal))}</span>
              </div>
              {Number(pedido.desconto) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>-{formatPrice(Number(pedido.desconto))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(Number(pedido.total))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Lateral */}
        <div className="space-y-6">
          {/* Agendamento */}
          {pedido.agendamento && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="text-lg font-medium">
                    {new Date(pedido.agendamento.data).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {new Date(pedido.agendamento.hora).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {pedido.agendamento.observacoes && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Obs: {pedido.agendamento.observacoes}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Local de Retirada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Local
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{pedido.loja.nome}</p>
              <p className="text-sm text-muted-foreground">{pedido.loja.endereco}</p>
              <p className="text-sm text-muted-foreground">
                {pedido.loja.cidade} - {pedido.loja.estado}
              </p>
              {pedido.loja.telefone && (
                <p className="text-sm text-muted-foreground mt-2">
                  Tel: {pedido.loja.telefone}
                </p>
              )}
            </CardContent>
          </Card>

          {/* QR Code (simulado) */}
          {pedido.status === 'pronto' && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  QR Code para Retirada
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <div className="w-32 h-32 bg-muted rounded flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Apresente este codigo na loja para retirar seu pedido
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Acoes */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 p-6">
          <Link href={`https://wa.me/${pedido.loja.whatsapp?.replace(/\D/g, '')}`} target="_blank">
            <Button variant="outline">Falar com a Loja</Button>
          </Link>
          {pedido.status === 'concluido' && (
            <Link href="/minha-conta/avaliacoes">
              <Button>Avaliar Pedido</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
