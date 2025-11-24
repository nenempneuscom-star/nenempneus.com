export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { senhaAtual, novaSenha } = await req.json()

        if (!senhaAtual || !novaSenha) {
            return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias' }, { status: 400 })
        }

        if (novaSenha.length < 6) {
            return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 })
        }

        // Buscar usuário com senha
        const usuario = await db.usuario.findUnique({
            where: { id: session.id },
        })

        if (!usuario) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Verificar senha atual
        const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha)

        if (!senhaValida) {
            return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
        }

        // Hash da nova senha
        const novaSenhaHash = await bcrypt.hash(novaSenha, 10)

        // Atualizar senha
        await db.usuario.update({
            where: { id: session.id },
            data: { senha: novaSenhaHash },
        })

        return NextResponse.json({ success: true, message: 'Senha alterada com sucesso' })
    } catch (error) {
        console.error('Erro ao alterar senha:', error)
        return NextResponse.json({ error: 'Erro ao alterar senha' }, { status: 500 })
    }
}
