import { NovoAgendamentoForm } from '@/components/admin/agendamentos/NovoAgendamentoForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NovoAgendamentoPage() {
    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/agendamentos">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Novo Agendamento</h2>
                    <p className="text-muted-foreground">Crie um novo agendamento para um cliente.</p>
                </div>
            </div>

            <NovoAgendamentoForm />
        </div>
    )
}
