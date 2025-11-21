import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from './lib/auth'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Rotas públicas
    const publicPaths = ['/login', '/api/webhooks', '/api/auth']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // Rotas admin protegidas
    const isAdminPath = pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin')

    if (isAdminPath && !isPublicPath) {
        const token = request.cookies.get('session')?.value

        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const session = await verifySession(token)

        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
    ],
}
