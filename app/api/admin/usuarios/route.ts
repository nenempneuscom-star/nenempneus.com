import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// GET - Listar usuários
export async function GET() {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Buscar usuário atual para pegar o lojaId e verificar permissões
        const usuarioAtual = await db.usuario.findUnique({
            where: { id: session.userId },
            select: { lojaId: true, role: true, permissoes: true }
        })

        if (!usuarioAtual) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Verificar se tem permissão para gerenciar usuários
        const permissoes = usuarioAtual.permissoes as any
        if (usuarioAtual.role !== 'supremo' && !permissoes?.usuarios) {
            return NextResponse.json({ error: 'Sem permissão para gerenciar usuários' }, { status: 403 })
        }

        const usuarios = await db.usuario.findMany({
            where: { lojaId: usuarioAtual.lojaId },
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                permissoes: true,
                ativo: true,
                ultimoLogin: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(usuarios)
    } catch (error) {
        console.error('Erro ao listar usuários:', error)
        return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 })
    }
}

// POST - Criar novo usuário
export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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
            return NextResponse.json({ error: 'Sem permissão para criar usuários' }, { status: 403 })
        }

        const { nome, email, senha, role, permissoes } = await request.json()

        // Validações
        if (!nome || !email || !senha) {
            return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
        }

        // Verificar se email já existe
        const emailExiste = await db.usuario.findUnique({
            where: { email }
        })

        if (emailExiste) {
            return NextResponse.json({ error: 'Este email já está em uso' }, { status: 400 })
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10)

        // Criar usuário
        const novoUsuario = await db.usuario.create({
            data: {
                lojaId: usuarioAtual.lojaId,
                nome,
                email,
                senhaHash,
                role: role || 'funcionario',
                permissoes: permissoes || {
                    dashboard: true,
                    produtos: true,
                    pedidos: true,
                    agendamentos: true,
                    whatsapp: false,
                    configuracoes: false,
                    usuarios: false
                }
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

        return NextResponse.json(novoUsuario, { status: 201 })
    } catch (error) {
        console.error('Erro ao criar usuário:', error)
        return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
    }
}
