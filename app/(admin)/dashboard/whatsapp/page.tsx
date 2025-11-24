import { getConversas } from '@/lib/admin/whatsapp'
import { WhatsAppClient } from '@/components/admin/whatsapp/WhatsAppClient'

export const dynamic = 'force-dynamic'

export default async function WhatsAppPage() {
  const conversasRaw = await getConversas()

  // Serializar datas para passar para o componente cliente
  const conversas = conversasRaw.map(c => ({
    ...c,
    ultimaMensagemEm: c.ultimaMensagemEm ? c.ultimaMensagemEm.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <div className="flex-1 h-[calc(100vh-65px)] p-4 md:p-6 overflow-hidden">
      <div className="mb-4">
        <h2 className="text-3xl font-bold tracking-tight">WhatsApp</h2>
        <p className="text-muted-foreground">Gerencie suas conversas e atendimentos.</p>
      </div>

      <WhatsAppClient initialConversas={conversas} />
    </div>
  )
}
