import { NextResponse } from 'next/server'
import { getDashboardMetricas } from '@/lib/whatsapp/analytics/metrics'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const dashboard = await getDashboardMetricas()

        if (!dashboard) {
            return NextResponse.json(
                { error: 'Não foi possível carregar métricas' },
                { status: 500 }
            )
        }

        return NextResponse.json(dashboard)
    } catch (error) {
        console.error('Erro ao buscar métricas:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
