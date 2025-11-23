import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/admin/Sidebar'
import { Header } from '@/components/admin/Header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Usuário mockado para acesso livre
  const user = {
    nome: 'Administrador',
    email: 'admin@nenempneus.com',
    role: 'admin'
  }

  return (
    <div className="flex h-screen bg-gray-100">
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
