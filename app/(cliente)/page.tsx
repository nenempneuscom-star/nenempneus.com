import { Hero } from '@/components/cliente/Hero'
import { ProdutoCard } from '@/components/cliente/ProdutoCard'
import { getProdutosDestaque } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Forçar renderização dinâmica (conecta ao banco)
export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const produtos = await getProdutosDestaque()

    return (
        <div>
            <Hero />

            {/* Produtos Destaque */}
            <section className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Produtos em Destaque</h2>
                    <p className="text-muted-foreground">
                        Confira nossas melhores ofertas de pne seminovos
                    </p>
                </div>

                {produtos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {produtos.map((produto) => (
                            <ProdutoCard
                                key={produto.id}
                                id={produto.id}
                                nome={produto.nome}
                                slug={produto.slug}
                                preco={Number(produto.preco)}
                                estoque={produto.estoque}
                                specs={produto.specs as any}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground">
                        Nenhum produto encontrado
                    </div>
                )}
            </section>

            {/* CTA Final */}
            <section className="bg-primary text-primary-foreground py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        Encontre o Pneu Ideal para seu Veículo
                    </h2>
                    <p className="text-lg mb-8 opacity-90">
                        Temos pneus para todos os tipos de veículos e orçamentos
                    </p>
                    <Button size="lg" variant="secondary" asChild>
                        <Link href="/catalogo">
                            Ver Catálogo Completo
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    )
}
