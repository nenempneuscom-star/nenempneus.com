import { getConversas } from '@/lib/admin/whatsapp'
import { WhatsAppCRM } from '@/components/admin/whatsapp/WhatsAppCRM'

export const dynamic = 'force-dynamic'

export default async function CRMPage() {
    const conversasRaw = await getConversas()

    const conversas = conversasRaw.map(c => ({
        ...c,
        ultimaMensagemEm: c.ultimaMensagemEm ? c.ultimaMensagemEm.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    }))

    return <WhatsAppCRM initialConversas={conversas} />
}
