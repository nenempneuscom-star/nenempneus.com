'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  User,
  LogOut,
  Menu,
  Home,
  Package,
  Calendar,
  Car,
  Heart,
  Settings,
} from 'lucide-react'

interface ClienteAreaHeaderProps {
  cliente: {
    id: string
    nome: string
    telefone: string | null
    pontos: number
  }
}

const mobileMenuItems = [
  { name: 'Minha Conta', href: '/minha-conta', icon: Home },
  { name: 'Meus Pedidos', href: '/minha-conta/pedidos', icon: Package },
  { name: 'Agendamentos', href: '/minha-conta/agendamentos', icon: Calendar },
  { name: 'Meus Veiculos', href: '/minha-conta/veiculos', icon: Car },
  { name: 'Favoritos', href: '/minha-conta/favoritos', icon: Heart },
  { name: 'Configuracoes', href: '/minha-conta/dados', icon: Settings },
]

export function ClienteAreaHeader({ cliente }: ClienteAreaHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/cliente/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden mr-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-4 border-b">
              <Link href="/" className="text-xl font-bold text-primary">
                Nenem <span className="text-foreground">Pneus</span>
              </Link>
            </div>
            <nav className="p-4 space-y-1">
              {mobileMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-primary">
          Nenem <span className="text-foreground">Pneus</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pontos */}
        <div className="hidden sm:flex items-center mr-4 px-3 py-1 bg-primary/10 rounded-full">
          <span className="text-sm font-medium text-primary">
            {cliente.pontos} pontos
          </span>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:inline-block max-w-[150px] truncate">
                {cliente.nome}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{cliente.nome}</p>
              <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/minha-conta">
                <Home className="mr-2 h-4 w-4" />
                Minha Conta
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/minha-conta/dados">
                <Settings className="mr-2 h-4 w-4" />
                Configuracoes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
