export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { nome, email } = await req.json()

        if (!nome || !email) {
            return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 })
        }

        // Verificar se email já existe (em outro usuário)
        const emailExiste = await db.usuario.findFirst({
            where: {
                email,
                NOT: { id: session.id },
            },
        })

        if (emailExiste) {
            return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 400 })
        }

        const usuario = await db.usuario.update({
            where: { id: session.id },
            data: { nome, email },
        })

        return NextResponse.json({ success: true, usuario })
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error)
        return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }
}
