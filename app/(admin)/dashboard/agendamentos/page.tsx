import { getAgendamentos } from '@/lib/admin/agendamentos'
import { AgendamentosClient } from '@/components/admin/agendamentos/AgendamentosClient'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: Promise<{
        status?: string
        dataInicio?: string
        dataFim?: string
    }>
}

export default async function AgendamentosPage({ searchParams }: PageProps) {
    const params = await searchParams

    const agendamentos = await getAgendamentos({
        status: params.status,
        dataInicio: params.dataInicio,
        dataFim: params.dataFim,
    })

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Agendamentos</h2>
                    <p className="text-muted-foreground">Gerencie sua agenda de instalações e serviços.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Agendamento
                </Button>
            </div>

            <AgendamentosClient initialAgendamentos={agendamentos} />
        </div>
    )
}
