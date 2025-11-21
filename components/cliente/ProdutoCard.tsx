import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'

interface ProdutoCardProps {
    id: string
    nome: string
    slug: string
    preco: number
    estoque: number
    specs: any
}

export function ProdutoCard({ id, nome, slug, preco, estoque, specs }: ProdutoCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <Link href={`/produto/${slug}`}>
                <div className="aspect-square bg-muted flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="text-6xl font-bold text-primary mb-2">
                            {specs.aro}"
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {specs.largura}/{specs.perfil}R{specs.aro}
                        </div>
                    </div>
                </div>
            </Link>

            <CardContent className="p-4">
                <Link href={`/produto/${slug}`}>
                    <h3 className="font-semibold mb-2 hover:text-primary transition-colors">
                        {nome}
                    </h3>
                </Link>

                <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{specs.marca}</Badge>
                    <Badge variant="outline">Sulco: {specs.sulco}</Badge>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Estoque: {estoque} unidades</div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex items-center justify-between">
                <div>
                    <div className="text-2xl font-bold text-primary">
                        {formatPrice(preco)}
                    </div>
                </div>
                <Button size="sm">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Adicionar
                </Button>
            </CardFooter>
        </Card>
    )
}
