import { NextResponse } from 'next/server'
import { VEICULOS_BRASIL } from '@/lib/data/veiculos-brasil'

// GET - Retorna todos os veículos do catálogo estático
export async function GET() {
    try {
        return NextResponse.json({ success: true, veiculos: VEICULOS_BRASIL })
    } catch (error: any) {
        console.error('Erro ao ler veículos:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// POST - Adicionar veículos (não suportado em produção - dados estáticos)
export async function POST() {
    return NextResponse.json(
        {
            success: false,
            error: 'Edição de veículos não disponível em produção. Os dados são gerenciados via código.'
        },
        { status: 403 }
    )
}

// DELETE - Remover veículos (não suportado em produção - dados estáticos)
export async function DELETE() {
    return NextResponse.json(
        {
            success: false,
            error: 'Exclusão de veículos não disponível em produção. Os dados são gerenciados via código.'
        },
        { status: 403 }
    )
}
