import { NextRequest, NextResponse } from 'next/server'
import {
    registrarFeedback,
    buscarFeedbacksNegativos,
    getEstatisticasFeedback,
    gerarSugestoesMelhoria,
} from '@/lib/whatsapp/learning/feedback'

export const dynamic = 'force-dynamic'

// POST - Registrar feedback
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { conversaId, mensagemId, tipo, feedback, correcao, usuarioId } = body

        if (!conversaId || !mensagemId || !tipo) {
            return NextResponse.json(
                { error: 'conversaId, mensagemId e tipo são obrigatórios' },
                { status: 400 }
            )
        }

        if (!['positivo', 'negativo', 'correcao'].includes(tipo)) {
            return NextResponse.json(
                { error: 'tipo deve ser: positivo, negativo ou correcao' },
                { status: 400 }
            )
        }

        const resultado = await registrarFeedback(conversaId, mensagemId, tipo, {
            feedback,
            correcao,
            usuarioId,
        })

        if (!resultado) {
            return NextResponse.json(
                { error: 'Erro ao registrar feedback' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, feedback: resultado })
    } catch (error) {
        console.error('Erro ao processar feedback:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

// GET - Buscar feedbacks e estatísticas
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const tipo = searchParams.get('tipo')

        if (tipo === 'estatisticas') {
            const stats = await getEstatisticasFeedback()
            return NextResponse.json(stats)
        }

        if (tipo === 'sugestoes') {
            const sugestoes = await gerarSugestoesMelhoria()
            return NextResponse.json({ sugestoes })
        }

        // Default: buscar feedbacks negativos
        const feedbacks = await buscarFeedbacksNegativos(50)
        return NextResponse.json({ feedbacks })
    } catch (error) {
        console.error('Erro ao buscar feedbacks:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
