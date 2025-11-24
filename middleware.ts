import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'secret-key-change-in-production'
)

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Rotas públicas do admin - não precisam de autenticação
    if (pathname === '/login') {
        // Se já está logado, redireciona para o dashboard
        const session = request.cookies.get('session')?.value
        if (session) {
            try {
                await jwtVerify(session, SECRET_KEY)
                return NextResponse.redirect(new URL('/dashboard', request.url))
            } catch {
                // Token inválido, deixa acessar o login
            }
        }
        return NextResponse.next()
    }

    // Proteger rotas do dashboard
    if (pathname.startsWith('/dashboard')) {
        const session = request.cookies.get('session')?.value

        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        try {
            await jwtVerify(session, SECRET_KEY)
            return NextResponse.next()
        } catch {
            // Token inválido ou expirado
            const response = NextResponse.redirect(new URL('/login', request.url))
            response.cookies.delete('session')
            return response
        }
    }

    // Todas as outras rotas são públicas
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
    ],
}

