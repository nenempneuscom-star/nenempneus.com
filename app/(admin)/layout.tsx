import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/admin/Sidebar'
import { Header } from '@/components/admin/Header'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { PermissionsProvider } from '@/contexts/PermissionsContext'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar sessão
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  // Buscar dados completos do usuário (usando any para evitar erro de tipo com JSON)
  const usuario: any = await db.usuario.findUnique({
    where: { id: session.userId },
    select: {
      nome: true,
      email: true,
      role: true,
      permissoes: true,
    }
  })

  if (!usuario) {
    redirect('/login')
  }

  // Parse permissoes JSON
  const permissoes = typeof usuario.permissoes === 'string'
    ? JSON.parse(usuario.permissoes)
    : (usuario.permissoes || {})

  const user = {
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    permissoes: permissoes as Record<string, boolean>
  }

  return (
    <PermissionsProvider permissoes={user.permissoes}>
      <div className="flex h-screen bg-background">
        <Sidebar permissoes={user.permissoes} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} />
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </PermissionsProvider>
  )
}
