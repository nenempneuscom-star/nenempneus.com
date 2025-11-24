import { redirect } from 'next/navigation'
// import { getSession } from '@/lib/auth'
import { getStats, getPedidosRecentes } from '@/lib/admin/stats'
import { StatsCard } from '@/components/admin/StatsCard'
import { RecentOrders } from '@/components/admin/RecentOrders'
import { formatPrice } from '@/lib/utils'
import {
  DollarSign,
  ShoppingCart,
  Calendar,
  MessageSquare,
} from 'lucide-react'

import { DashboardHeader } from '@/components/admin/DashboardHeader'

// Forçar renderização dinâmica para evitar erros de build
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // const session = await getSession()
  // if (!session) {
  //   redirect('/login')
  // }

  const stats = await getStats()
  const pedidosRecentes = await getPedidosRecentes()

  if (!stats) {
    return <div className="p-8">Erro ao carregar estatisticas</div>
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 pb-12 bg-background/50 min-h-screen">
      <DashboardHeader />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Receita Total"
          value={formatPrice(stats.receita.total)}
          description={`${formatPrice(stats.receita.mes)} este mês`}
          icon={DollarSign}
          trend={{ value: 12, positive: true }}
        />
        <StatsCard
          title="Pedidos"
          value={stats.pedidos.total}
          description={`${stats.pedidos.hoje} hoje`}
          icon={ShoppingCart}
          trend={{ value: 4, positive: true }}
        />
        <StatsCard
          title="Agendamentos Hoje"
          value={stats.agendamentos.hoje}
          description="Instalações programadas"
          icon={Calendar}
        />
        <StatsCard
          title="WhatsApp Ativo"
          value={stats.whatsapp.conversasAtivas}
          description="Conversas em andamento"
          icon={MessageSquare}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        <RecentOrders pedidos={pedidosRecentes} />
      </div>
    </div>
  )
}
