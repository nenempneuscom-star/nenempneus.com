export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
    getMarcas,
    getModelosByMarca,
    getAnosByMarcaModelo,
    getMedidasPneu,
    buscarVeiculos
} from '@/lib/data/veiculos-brasil'

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const action = searchParams.get('action')
    const marca = searchParams.get('marca')
    const modelo = searchParams.get('modelo')
    const ano = searchParams.get('ano')
    const busca = searchParams.get('busca')

    try {
        switch (action) {
            case 'marcas':
                return NextResponse.json({
                    success: true,
                    marcas: getMarcas()
                })

            case 'modelos':
                if (!marca) {
                    return NextResponse.json(
                        { success: false, error: 'Marca é obrigatória' },
                        { status: 400 }
                    )
                }
                return NextResponse.json({
                    success: true,
                    modelos: getModelosByMarca(marca)
                })

            case 'anos':
                if (!marca || !modelo) {
                    return NextResponse.json(
                        { success: false, error: 'Marca e modelo são obrigatórios' },
                        { status: 400 }
                    )
                }
                return NextResponse.json({
                    success: true,
                    anos: getAnosByMarcaModelo(marca, modelo)
                })

            case 'medidas':
                if (!marca || !modelo) {
                    return NextResponse.json(
                        { success: false, error: 'Marca e modelo são obrigatórios' },
                        { status: 400 }
                    )
                }
                return NextResponse.json({
                    success: true,
                    medidas: getMedidasPneu(marca, modelo, ano ? Number(ano) : undefined)
                })

            case 'buscar':
                if (!busca) {
                    return NextResponse.json(
                        { success: false, error: 'Termo de busca é obrigatório' },
                        { status: 400 }
                    )
                }
                return NextResponse.json({
                    success: true,
                    resultados: buscarVeiculos(busca)
                })

            default:
                // Retorna todas as marcas por padrão
                return NextResponse.json({
                    success: true,
                    marcas: getMarcas()
                })
        }
    } catch (error: any) {
        console.error('Erro na API de veículos:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
