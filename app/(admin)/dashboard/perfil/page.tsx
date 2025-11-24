export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PerfilClient } from '@/components/admin/perfil/PerfilClient'
import { db } from '@/lib/db'

export default async function PerfilPage() {
    const session = await getSession()

    if (!session) {
        redirect('/login')
    }

    const usuario = await db.usuario.findUnique({
        where: { id: session.id },
        select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            createdAt: true,
        },
    })

    if (!usuario) {
        redirect('/login')
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Meu Perfil</h2>
                <p className="text-muted-foreground">Gerencie suas informações pessoais e senha.</p>
            </div>

            <PerfilClient usuario={usuario} />
        </div>
    )
}
