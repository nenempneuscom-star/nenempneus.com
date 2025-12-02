'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Car,
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: any
  permission: string // Chave da permissão no objeto permissoes
}

const allNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { name: 'Produtos', href: '/dashboard/produtos', icon: ShoppingBag, permission: 'produtos' },
  { name: 'Pedidos', href: '/dashboard/pedidos', icon: Package, permission: 'pedidos' },
  { name: 'Agendamentos', href: '/dashboard/agendamentos', icon: Calendar, permission: 'agendamentos' },
  { name: 'Veículos', href: '/dashboard/veiculos', icon: Car, permission: 'produtos' },
  { name: 'WhatsApp', href: '/dashboard/whatsapp', icon: MessageSquare, permission: 'whatsapp' },
  { name: 'Configuracoes', href: '/dashboard/configuracoes', icon: Settings, permission: 'configuracoes' },
]

interface SidebarProps {
  permissoes: Record<string, boolean>
}

export function Sidebar({ permissoes }: SidebarProps) {
  const pathname = usePathname()

  // Filtrar navegação baseado nas permissões do usuário
  const navigation = allNavigation.filter(item => permissoes[item.permission] === true)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-secondary">
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <div className="text-xl font-bold text-primary">
          Nenem <span className="text-foreground">Pneus</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
