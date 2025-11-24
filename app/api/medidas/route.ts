export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        // Buscar todos os produtos com specs
        const produtos = await db.produto.findMany({
            where: {
                ativo: true,
                estoque: { gt: 0 }
            },
            select: {
                specs: true
            }
        })

        // Extrair combinações únicas de medidas
        const medidasMap = new Map<string, Set<string>>()
        const combinacoes: { largura: string; perfil: string; aro: string }[] = []

        produtos.forEach(produto => {
            const specs = produto.specs as any
            if (specs?.largura && specs?.perfil && specs?.aro) {
                const key = `${specs.largura}-${specs.perfil}-${specs.aro}`
                if (!medidasMap.has(key)) {
                    medidasMap.set(key, new Set())
                    combinacoes.push({
                        largura: String(specs.largura),
                        perfil: String(specs.perfil),
                        aro: String(specs.aro)
                    })
                }
            }
        })

        // Organizar por largura -> perfis disponíveis -> aros disponíveis
        const larguras = [...new Set(combinacoes.map(c => c.largura))].sort((a, b) => Number(a) - Number(b))

        // Criar mapa de largura -> perfis
        const larguraPerfis: Record<string, string[]> = {}
        larguras.forEach(largura => {
            const perfis = [...new Set(combinacoes.filter(c => c.largura === largura).map(c => c.perfil))]
            larguraPerfis[largura] = perfis.sort((a, b) => Number(a) - Number(b))
        })

        // Criar mapa de largura+perfil -> aros
        const perfilAros: Record<string, string[]> = {}
        combinacoes.forEach(c => {
            const key = `${c.largura}-${c.perfil}`
            if (!perfilAros[key]) {
                perfilAros[key] = []
            }
            if (!perfilAros[key].includes(c.aro)) {
                perfilAros[key].push(c.aro)
            }
        })

        // Ordenar aros
        Object.keys(perfilAros).forEach(key => {
            perfilAros[key].sort((a, b) => Number(a) - Number(b))
        })

        return NextResponse.json({
            larguras,
            larguraPerfis,
            perfilAros
        })
    } catch (error) {
        console.error('Erro ao buscar medidas:', error)
        return NextResponse.json({ error: 'Erro ao buscar medidas' }, { status: 500 })
    }
}
