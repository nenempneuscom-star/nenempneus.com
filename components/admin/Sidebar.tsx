'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useMobileMenu } from '@/contexts/MobileMenuContext'
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Calendar,
    MessageSquare,
    Settings,
    LogOut,
    Car,
    X,
    ExternalLink,
} from 'lucide-react'

interface NavigationItem {
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    permission: string
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
    const { isOpen, isCollapsed, close } = useMobileMenu()

    // Filtrar navegação baseado nas permissões do usuário
    const navigation = allNavigation.filter(item => permissoes[item.permission] === true)

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/login'
    }

    const handleNavClick = () => {
        // Fechar menu ao navegar (mobile)
        close()
    }

    return (
        <>
            {/* Overlay escuro para mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={close}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-50
                    flex h-screen w-64 flex-col bg-secondary
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${!isCollapsed ? 'lg:static lg:translate-x-0' : ''}
                `}
            >
                {/* Header com logo e botão fechar (mobile) */}
                <div className="flex items-center justify-between px-6 py-5 border-b">
                    <div className="text-xl font-bold text-primary">
                        Nenem <span className="text-foreground">Pneus</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={close}
                        aria-label="Fechar menu"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link key={item.name} href={item.href} onClick={handleNavClick}>
                                <Button
                                    variant={isActive ? 'default' : 'ghost'}
                                    className="w-full justify-start"
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    {item.name}
                                </Button>
                            </Link>
                        )
                    })}

                    {/* Botão CRM WhatsApp - abre em nova aba */}
                    {permissoes['whatsapp'] && (
                        <a
                            href="/crm"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleNavClick}
                        >
                            <Button
                                variant="ghost"
                                className="w-full justify-start bg-gradient-to-r from-green-600/20 to-green-500/10 hover:from-green-600/30 hover:to-green-500/20 border border-green-500/30 text-green-400"
                            >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                CRM WhatsApp
                                <ExternalLink className="ml-auto h-3 w-3 opacity-60" />
                            </Button>
                        </a>
                    )}
                </nav>

                <div className="border-t p-3">
                    <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </div>
        </>
    )
}
