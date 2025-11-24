import { redirect } from 'next/navigation'
import { getClienteLogado } from '@/lib/cliente/auth'
import { ClienteAreaSidebar } from '@/components/cliente/ClienteAreaSidebar'
import { ClienteAreaHeader } from '@/components/cliente/ClienteAreaHeader'

export default async function MinhaContaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cliente = await getClienteLogado()

  if (!cliente) {
    redirect('/entrar')
  }

  return (
    <div className="min-h-screen bg-background">
      <ClienteAreaHeader cliente={cliente} />
      <div className="flex">
        <ClienteAreaSidebar />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
