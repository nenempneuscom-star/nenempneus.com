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
        const medidasMap = new Map<string, boolean>()
        const combinacoes: { largura: string; perfil: string; aro: string }[] = []

        produtos.forEach(produto => {
            const specs = produto.specs as any
            if (specs?.largura && specs?.perfil && specs?.aro) {
                const key = `${specs.largura}-${specs.perfil}-${specs.aro}`
                if (!medidasMap.has(key)) {
                    medidasMap.set(key, true)
                    combinacoes.push({
                        largura: String(specs.largura),
                        perfil: String(specs.perfil),
                        aro: String(specs.aro)
                    })
                }
            }
        })

        // Hierarquia: Aro > Largura > Perfil

        // Lista única de aros (nível raiz)
        const aros = [...new Set(combinacoes.map(c => c.aro))].sort((a, b) => Number(a) - Number(b))

        // Mapa aro -> larguras disponíveis
        const aroLarguras: Record<string, string[]> = {}
        aros.forEach(aro => {
            const larguras = [...new Set(combinacoes.filter(c => c.aro === aro).map(c => c.largura))]
            aroLarguras[aro] = larguras.sort((a, b) => Number(a) - Number(b))
        })

        // Mapa aro+largura -> perfis disponíveis
        const larguraPerfis: Record<string, string[]> = {}
        combinacoes.forEach(c => {
            const key = `${c.aro}-${c.largura}`
            if (!larguraPerfis[key]) {
                larguraPerfis[key] = []
            }
            if (!larguraPerfis[key].includes(c.perfil)) {
                larguraPerfis[key].push(c.perfil)
            }
        })

        // Ordenar perfis
        Object.keys(larguraPerfis).forEach(key => {
            larguraPerfis[key].sort((a, b) => Number(a) - Number(b))
        })

        return NextResponse.json({
            aros,
            aroLarguras,
            larguraPerfis
        })
    } catch (error) {
        console.error('Erro ao buscar medidas:', error)
        return NextResponse.json({ error: 'Erro ao buscar medidas' }, { status: 500 })
    }
}
