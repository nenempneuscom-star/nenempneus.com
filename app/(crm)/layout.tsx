import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function CRMLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Verificar sessão
    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    // Verificar permissão de WhatsApp
    const usuario: any = await db.usuario.findUnique({
        where: { id: session.userId },
        select: { permissoes: true }
    })

    if (!usuario) {
        redirect('/login')
    }

    const permissoes = typeof usuario.permissoes === 'string'
        ? JSON.parse(usuario.permissoes)
        : (usuario.permissoes || {})

    if (!permissoes.whatsapp) {
        redirect('/dashboard')
    }

    // Layout limpo - apenas o conteúdo, sem sidebar/header
    return (
        <div className="h-screen w-screen overflow-hidden bg-[#111b21]">
            {children}
        </div>
    )
}
