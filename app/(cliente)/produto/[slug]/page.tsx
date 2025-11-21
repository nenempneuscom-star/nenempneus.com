import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProdutoDetalhes } from '@/components/cliente/ProdutoDetalhes'
import { getProdutoPorSlug } from '@/lib/actions'

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

interface ProdutoPageProps {
    params: Promise<{
        slug: string
    }>
}

export default async function ProdutoPage({ params }: ProdutoPageProps) {
    const { slug } = await params
    const produto = await getProdutoPorSlug(slug)

    if (!produto) {
        notFound()
    }

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Breadcrumb */}
            <div className="mb-8">
                <Button variant="ghost" asChild>
                    <Link href="/catalogo">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Voltar ao Catálogo
                    </Link>
                </Button>
            </div>

            {/* Detalhes do Produto */}
            <ProdutoDetalhes produto={produto} />
        </div>
    )
}
