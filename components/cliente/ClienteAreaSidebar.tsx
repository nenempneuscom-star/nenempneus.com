'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Calendar,
  Car,
  User,
} from 'lucide-react'

const menuItems = [
  {
    title: 'Geral',
    items: [
      { name: 'Minha Conta', href: '/minha-conta', icon: LayoutDashboard },
      { name: 'Meus Pedidos', href: '/minha-conta/pedidos', icon: Package },
      { name: 'Agendamentos', href: '/minha-conta/agendamentos', icon: Calendar },
    ],
  },
  {
    title: 'Meus Dados',
    items: [
      { name: 'Meus Veiculos', href: '/minha-conta/veiculos', icon: Car },
      { name: 'Dados Pessoais', href: '/minha-conta/dados', icon: User },
    ],
  },
]

export function ClienteAreaSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-card min-h-[calc(100vh-4rem)]">
      <nav className="flex-1 p-4 space-y-6">
        {menuItems.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/minha-conta' && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
