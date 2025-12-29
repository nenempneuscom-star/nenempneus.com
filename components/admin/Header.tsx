'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, LogOut, Settings, UserCircle, ExternalLink, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useMobileMenu } from '@/contexts/MobileMenuContext'

interface HeaderProps {
    user: {
        nome: string
        email: string
        role: string
        permissoes: Record<string, boolean>
    }
}

export function Header({ user }: HeaderProps) {
    const router = useRouter()
    const { toggle, isCollapsed } = useMobileMenu()

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
        router.refresh()
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'supremo':
                return { label: 'Supremo', variant: 'default' as const }
            case 'admin':
                return { label: 'Admin', variant: 'secondary' as const }
            default:
                return { label: role, variant: 'outline' as const }
        }
    }

    const roleInfo = getRoleLabel(user.role)

    return (
        <header className="bg-background border-b h-16 flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-3">
                {/* Botão hamburguer - visível em mobile ou quando sidebar colapsada */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={isCollapsed ? '' : 'lg:hidden'}
                    onClick={toggle}
                    aria-label="Abrir menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <h2 className="text-base lg:text-lg font-semibold text-foreground">
                    Painel Administrativo
                </h2>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
                <Link href="/" target="_blank">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        <span className="hidden sm:inline">Ver Site</span>
                    </Button>
                </Link>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary">
                                <User className="h-4 w-4" />
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium leading-none">{user.nome}</p>
                                    <Badge variant={roleInfo.variant} className="text-[10px] px-1.5 py-0">
                                        {roleInfo.label}
                                    </Badge>
                                </div>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/perfil')}>
                            <UserCircle className="mr-2 h-4 w-4" />
                            Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/configuracoes')}>
                            <Settings className="mr-2 h-4 w-4" />
                            Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
