export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSlotsDisponiveis } from '@/lib/agendamento'
import { parseISO } from 'date-fns'

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams
        const dataStr = searchParams.get('data')

        if (!dataStr) {
            return NextResponse.json(
                { error: 'Data não fornecida' },
                { status: 400 }
            )
        }

        const data = parseISO(dataStr)
        const slots = await getSlotsDisponiveis(data)

        return NextResponse.json({ success: true, slots })
    } catch (error: any) {
        console.error('Erro ao buscar disponibilidade:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
