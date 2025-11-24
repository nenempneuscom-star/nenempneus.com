import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const email = body.email
        const password = body.password || body.senha

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email e senha são obrigatórios' },
                { status: 400 }
            )
        }

        const result = await authenticateUser(email, password)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 401 }
            )
        }

        // Criar sessão
        await createSession({
            userId: result.user.id,
            email: result.user.email,
            role: result.user.role,
        })

        return NextResponse.json({
            success: true,
            user: {
                id: result.user.id,
                nome: result.user.nome,
                email: result.user.email,
                role: result.user.role,
            },
        })
    } catch (error) {
        console.error('Erro no login:', error)
        return NextResponse.json(
            { success: false, error: 'Erro no servidor' },
            { status: 500 }
        )
    }
}
