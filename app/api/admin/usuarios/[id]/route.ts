import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// PUT - Atualizar usuário
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = await params

        // Buscar usuário atual
        const usuarioAtual = await db.usuario.findUnique({
            where: { id: session.userId },
            select: { lojaId: true, role: true, permissoes: true }
        })

        if (!usuarioAtual) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Verificar permissão
        const permissoesAtual = usuarioAtual.permissoes as any
        if (usuarioAtual.role !== 'supremo' && !permissoesAtual?.usuarios) {
            return NextResponse.json({ error: 'Sem permissão para editar usuários' }, { status: 403 })
        }

        // Buscar usuário a ser editado
        const usuarioAlvo = await db.usuario.findUnique({
            where: { id },
            select: { lojaId: true, role: true }
        })

        if (!usuarioAlvo || usuarioAlvo.lojaId !== usuarioAtual.lojaId) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Não permitir editar usuário supremo se não for supremo
        if (usuarioAlvo.role === 'supremo' && usuarioAtual.role !== 'supremo') {
            return NextResponse.json({ error: 'Sem permissão para editar este usuário' }, { status: 403 })
        }

        const { nome, email, role, permissoes, ativo } = await request.json()

        // Atualizar usuário
        const usuarioAtualizado = await db.usuario.update({
            where: { id },
            data: {
                ...(nome && { nome }),
                ...(email && { email }),
                ...(role && { role }),
                ...(permissoes && { permissoes }),
                ...(typeof ativo === 'boolean' && { ativo })
            },
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                permissoes: true,
                ativo: true,
                createdAt: true,
            }
        })

        return NextResponse.json(usuarioAtualizado)
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error)
        return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
    }
}

// DELETE - Remover usuário
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = await params

        // Não pode deletar a si mesmo
        if (id === session.userId) {
            return NextResponse.json({ error: 'Você não pode remover sua própria conta' }, { status: 400 })
        }

        // Buscar usuário atual
        const usuarioAtual = await db.usuario.findUnique({
            where: { id: session.userId },
            select: { lojaId: true, role: true, permissoes: true }
        })

        if (!usuarioAtual) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Verificar permissão
        const permissoesAtual = usuarioAtual.permissoes as any
        if (usuarioAtual.role !== 'supremo' && !permissoesAtual?.usuarios) {
            return NextResponse.json({ error: 'Sem permissão para remover usuários' }, { status: 403 })
        }

        // Buscar usuário a ser removido
        const usuarioAlvo = await db.usuario.findUnique({
            where: { id },
            select: { lojaId: true, role: true }
        })

        if (!usuarioAlvo || usuarioAlvo.lojaId !== usuarioAtual.lojaId) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Não permitir remover usuário supremo
        if (usuarioAlvo.role === 'supremo') {
            return NextResponse.json({ error: 'Não é possível remover usuário supremo' }, { status: 403 })
        }

        await db.usuario.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao remover usuário:', error)
        return NextResponse.json({ error: 'Erro ao remover usuário' }, { status: 500 })
    }
}
