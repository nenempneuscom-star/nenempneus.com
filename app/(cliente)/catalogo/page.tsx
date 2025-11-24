'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ProdutoCard } from '@/components/cliente/ProdutoCard'
import { FiltrosCatalogo } from '@/components/cliente/FiltrosCatalogo'
import { BuscaVeiculo } from '@/components/cliente/BuscaVeiculo'
import { getProdutos, getMarcas, getAros } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

function CatalogoContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [produtos, setProdutos] = useState<any[]>([])
    const [marcas, setMarcas] = useState<string[]>([])
    const [aros, setAros] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [medidaFiltrada, setMedidaFiltrada] = useState<string | null>(null)

    useEffect(() => {
        // Ler filtros da URL
        const largura = searchParams.get('largura')
        const perfil = searchParams.get('perfil')
        const aro = searchParams.get('aro')

        const filtros: any = {}
        if (largura) filtros.largura = largura
        if (perfil) filtros.perfil = perfil
        if (aro) filtros.aro = aro

        // Mostrar medida selecionada
        if (largura && perfil && aro) {
            setMedidaFiltrada(`${largura}/${perfil}R${aro}`)
        } else {
            setMedidaFiltrada(null)
        }

        carregarDados(filtros)
    }, [searchParams])

    const carregarDados = async (filtros: any = {}) => {
        setLoading(true)
        const [produtosData, marcasData, arosData] = await Promise.all([
            getProdutos(filtros),
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

                {/* Mostrar medida filtrada */}
                {medidaFiltrada && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Filtrando por:</span>
                        <Badge variant="secondary" className="text-sm flex items-center gap-1">
                            {medidaFiltrada}
                            <button
                                onClick={() => router.push('/catalogo')}
                                className="ml-1 hover:bg-muted rounded-full p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    </div>
                )}
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

function CatalogoLoading() {
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-8">
                <div className="h-10 w-64 bg-muted animate-pulse rounded mb-4" />
                <div className="h-6 w-96 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="lg:col-span-1">
                    <div className="h-64 bg-muted animate-pulse rounded" />
                </aside>
                <main className="lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-80 bg-muted animate-pulse rounded" />
                        ))}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default function CatalogoPage() {
    return (
        <Suspense fallback={<CatalogoLoading />}>
            <CatalogoContent />
        </Suspense>
    )
}
