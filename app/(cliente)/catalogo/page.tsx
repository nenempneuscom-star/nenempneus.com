'use client'

import { useEffect, useState } from 'react'
import { ProdutoCard } from '@/components/cliente/ProdutoCard'
import { FiltrosCatalogo } from '@/components/cliente/FiltrosCatalogo'
import { BuscaVeiculo } from '@/components/cliente/BuscaVeiculo'
import { getProdutos, getMarcas, getAros } from '@/lib/actions'
import { Button } from '@/components/ui/button'

export default function CatalogoPage() {
    const [produtos, setProdutos] = useState<any[]>([])
    const [marcas, setMarcas] = useState<string[]>([])
    const [aros, setAros] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        carregarDados()
    }, [])

    const carregarDados = async () => {
        setLoading(true)
        const [produtosData, marcasData, arosData] = await Promise.all([
            getProdutos(),
            getMarcas(),
            getAros(),
        ])
        setProdutos(produtosData)
        setMarcas(marcasData)
        setAros(arosData)
        setLoading(false)
    }

    const handleFiltrar = async (filtros: any) => {
        setLoading(true)
        const produtosFiltrados = await getProdutos(filtros)
        setProdutos(produtosFiltrados)
        setLoading(false)
    }

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4">Catálogo de Pneus</h1>
                <p className="text-muted-foreground">
                    Encontre o pneu ideal para seu veículo. Temos mais de {produtos.length} opções disponíveis.
                </p>
            </div>

            {/* Busca por Veículo */}
            <div className="mb-8">
                <BuscaVeiculo />
            </div>

            {/* Grid: Filtros + Produtos */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Filtros */}
                <aside className="lg:col-span-1">
                    <div className="sticky top-4">
                        <FiltrosCatalogo
                            marcas={marcas}
                            aros={aros}
                            onFiltrar={handleFiltrar}
                        />
                    </div>
                </aside>

                {/* Grid Produtos */}
                <main className="lg:col-span-3">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="text-muted-foreground">Carregando produtos...</div>
                        </div>
                    ) : produtos.length > 0 ? (
                        <>
                            <div className="mb-4 text-sm text-muted-foreground">
                                {produtos.length} produto(s) encontrado(s)
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {produtos.map((produto) => (
                                    <ProdutoCard
                                        key={produto.id}
                                        id={produto.id}
                                        nome={produto.nome}
                                        slug={produto.slug}
                                        preco={Number(produto.preco)}
                                        estoque={produto.estoque}
                                        specs={produto.specs as any}
                                        imagemUrl={produto.imagemUrl}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-muted-foreground mb-4">
                                Nenhum produto encontrado com estes filtros
                            </div>
                            <Button onClick={() => handleFiltrar({})}>
                                Limpar Filtros
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
