import { getConversas } from '@/lib/admin/whatsapp'
import { WhatsAppClient } from '@/components/admin/whatsapp/WhatsAppClient'
import { WhatsAppMetrics } from '@/components/admin/whatsapp/WhatsAppMetrics'
import { WhatsAppTraining } from '@/components/admin/whatsapp/WhatsAppTraining'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, BarChart3, Brain } from 'lucide-react'

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
    <div className="flex-1 p-4 md:p-6 overflow-hidden">
      <div className="mb-4">
        <h2 className="text-3xl font-bold tracking-tight">WhatsApp Sales</h2>
        <p className="text-muted-foreground">Gerencie conversas, leads e métricas de vendas.</p>
      </div>

      <Tabs defaultValue="conversas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversas" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversas
          </TabsTrigger>
          <TabsTrigger value="metricas" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="treinamento" className="gap-2">
            <Brain className="h-4 w-4" />
            Treinamento IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversas" className="h-[calc(100vh-220px)]">
          <WhatsAppClient initialConversas={conversas} />
        </TabsContent>

        <TabsContent value="metricas">
          <WhatsAppMetrics />
        </TabsContent>

        <TabsContent value="treinamento">
          <WhatsAppTraining />
        </TabsContent>
      </Tabs>
    </div>
  )
}
