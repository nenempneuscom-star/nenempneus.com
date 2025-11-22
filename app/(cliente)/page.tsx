import { Hero } from '@/components/cliente/Hero'
import { Features } from '@/components/cliente/Features'
import { ProdutoCard } from '@/components/cliente/ProdutoCard'
import { getProdutosDestaque } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Forçar renderização dinâmica (conecta ao banco)
export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const produtos = await getProdutosDestaque()

    return (
        <div className="min-h-screen">
            <Hero />

            <Features />

            {/* Produtos Destaque */}
            <section className="container mx-auto px-4 py-20">
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Produtos em <span className="text-primary">Destaque</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Confira nossas melhores ofertas de pneus seminovos com qualidade garantida
                    </p>
                </div>

                {produtos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {produtos.map((produto, index) => (
                            <div
                                key={produto.id}
                                className="animate-in fade-in slide-in-from-bottom-8 duration-700"
                                style={{
                                    animationDelay: `${index * 100}ms`,
                                    animationFillMode: 'backwards'
                                }}
                            >
                                <ProdutoCard
                                    id={produto.id}
                                    nome={produto.nome}
                                    slug={produto.slug}
                                    preco={Number(produto.preco)}
                                    estoque={produto.estoque}
                                    specs={produto.specs as any}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12">
                        <p className="text-lg">Nenhum produto encontrado no momento.</p>
                        <p className="text-sm mt-2">Estamos trabalhando para trazer as melhores ofertas para você!</p>
                    </div>
                )}
            </section>

            {/* CTA Final */}
            <section className="relative bg-gradient-to-br from-primary/90 to-primary text-primary-foreground py-20 overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl" />
                </div>

                <div className="relative container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        Encontre o Pneu Ideal para seu Veículo
                    </h2>
                    <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
                        Temos pneus para todos os tipos de veículos e orçamentos.<br />
                        Qualidade garantida e os melhores preços da região.
                    </p>
                    <Button
                        size="lg"
                        variant="secondary"
                        asChild
                        className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 hover:scale-105 transition-all hover:shadow-xl"
                    >
                        <Link href="/catalogo">
                            Ver Catálogo Completo
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    )
}
