export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { EditarAgendamentoForm } from '@/components/admin/agendamentos/EditarAgendamentoForm'

interface EditarAgendamentoPageProps {
    params: Promise<{ id: string }>
}

export default async function EditarAgendamentoPage({ params }: EditarAgendamentoPageProps) {
    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    const { id } = await params

    // Buscar usuário e loja
    const usuario = await db.usuario.findUnique({
        where: { id: session.userId },
        select: { lojaId: true }
    })

    if (!usuario) {
        redirect('/login')
    }

    // Buscar agendamento
    const agendamento = await db.agendamento.findFirst({
        where: {
            id,
            lojaId: usuario.lojaId
        },
        include: {
            cliente: true,
            pedido: {
                include: {
                    items: {
                        include: {
                            produto: true
                        }
                    }
                }
            }
        }
    })

    if (!agendamento) {
        redirect('/dashboard/agendamentos')
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Editar Agendamento</h2>
                    <p className="text-muted-foreground">
                        Modifique as informações do agendamento
                    </p>
                </div>
            </div>

            <EditarAgendamentoForm agendamento={agendamento} />
        </div>
    )
}
