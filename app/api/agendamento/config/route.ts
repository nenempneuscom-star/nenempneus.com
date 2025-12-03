export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LOJA_SLUG } from '@/lib/constants'

export async function GET() {
    try {
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
            include: { settings: true },
        })

        if (!loja?.settings) {
            return NextResponse.json(
                { error: 'Configurações não encontradas' },
                { status: 404 }
            )
        }

        const settings = loja.settings

        return NextResponse.json({
            success: true,
            config: {
                diasFuncionamento: settings.diasFuncionamento as number[] || [1, 2, 3, 4, 5, 6],
            }
        })
    } catch (error: any) {
        console.error('Erro ao buscar configurações:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
