import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/admin/Sidebar'
import { Header } from '@/components/admin/Header'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

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

  // Buscar dados completos do usuário
  const usuario = await db.usuario.findUnique({
    where: { id: session.userId },
    select: {
      nome: true,
      email: true,
      role: true,
    }
  })

  if (!usuario) {
    redirect('/login')
  }

  const user = {
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
