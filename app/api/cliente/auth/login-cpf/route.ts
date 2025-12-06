import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const LOJA_SLUG = 'nenem-pneus'
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'cliente-secret-key-change-in-production'
)
const COOKIE_NAME = 'cliente_session'

export async function POST(req: NextRequest) {
    try {
        const { cpf } = await req.json()

        if (!cpf) {
            return NextResponse.json(
                { error: 'CPF e obrigatorio' },
                { status: 400 }
            )
        }

        // Remover formatacao do CPF
        const cpfLimpo = cpf.replace(/\D/g, '')

        if (cpfLimpo.length !== 11) {
            return NextResponse.json(
                { error: 'CPF invalido' },
                { status: 400 }
            )
        }

        // Buscar loja
        const loja = await prisma.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) {
            return NextResponse.json(
                { error: 'Loja nao encontrada' },
                { status: 404 }
            )
        }

        // Buscar cliente pelo CPF
        const cliente = await prisma.cliente.findFirst({
            where: {
                lojaId: loja.id,
                cpf: cpfLimpo,
            },
        })

        if (!cliente) {
            return NextResponse.json(
                { error: 'CPF nao encontrado. Faca uma compra para se cadastrar.' },
                { status: 404 }
            )
        }

        // Criar JWT
        const token = await new SignJWT({
            clienteId: cliente.id,
            lojaId: loja.id,
            cpf: cpfLimpo,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('30d')
            .setIssuedAt()
            .sign(JWT_SECRET)

        // Salvar cookie
        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 dias
            path: '/',
        })

        return NextResponse.json({
            success: true,
            message: 'Login realizado com sucesso!',
        })
    } catch (error) {
        console.error('Erro ao fazer login por CPF:', error)
        return NextResponse.json(
            { error: 'Erro ao fazer login' },
            { status: 500 }
        )
    }
}
