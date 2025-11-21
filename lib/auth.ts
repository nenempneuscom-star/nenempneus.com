import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { db } from './db'

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'secret-key-change-in-production'
)

export interface SessionPayload {
    userId: string
    email: string
    role: string
    [key: string]: unknown
}

export async function createSession(payload: SessionPayload) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(SECRET_KEY)

    const cookieStore = await cookies()
    await cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: '/',
    })
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY)
        return payload as unknown as SessionPayload
    } catch (error) {
        return null
    }
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return null
    return verifySession(token)
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
}

export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

export async function authenticateUser(
    email: string,
    password: string
): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
        const user = await db.usuario.findUnique({
            where: { email },
            include: { loja: true },
        })

        if (!user) {
            return { success: false, error: 'Usuário não encontrado' }
        }

        if (!user.ativo) {
            return { success: false, error: 'Usuário inativo' }
        }

        const isValid = await verifyPassword(password, user.senhaHash)

        if (!isValid) {
            return { success: false, error: 'Senha incorreta' }
        }

        // Atualizar último login
        await db.usuario.update({
            where: { id: user.id },
            data: { ultimoLogin: new Date() },
        })

        return { success: true, user }
    } catch (error) {
        console.error('Erro na autenticação:', error)
        return { success: false, error: 'Erro no servidor' }
    }
}
