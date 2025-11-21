import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
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

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const stats = await getStats()
  const pedidosRecentes = await getPedidosRecentes()

  if (!stats) {
    return <div className="p-8">Erro ao carregar estatisticas</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Receita Total"
          value={formatPrice(stats.receita.total)}
          description={`${formatPrice(stats.receita.mes)} este mes`}
          icon={DollarSign}
        />
        <StatsCard
          title="Pedidos"
          value={stats.pedidos.total}
          description={`${stats.pedidos.hoje} hoje, ${stats.pedidos.mes} este mes`}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Agendamentos Hoje"
          value={stats.agendamentos.hoje}
          description="Instalacoes programadas"
          icon={Calendar}
        />
        <StatsCard
          title="WhatsApp Ativo"
          value={stats.whatsapp.conversasAtivas}
          description="Conversas em andamento"
          icon={MessageSquare}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RecentOrders pedidos={pedidosRecentes} />
      </div>
    </div>
  )
}
