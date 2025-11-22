'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'

interface ProdutoCardProps {
    id: string
    nome: string
    slug: string
    preco: number
    estoque: number
    specs: any
}

export function ProdutoCard({ id, nome, slug, preco, estoque, specs }: ProdutoCardProps) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <Card
            className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={`/produto/${slug}`}>
                <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center p-8 overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Animated circle */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'
                        }`}>
                        <div className="w-32 h-32 rounded-full border-2 border-primary/20 group-hover:border-primary/40 transition-colors" />
                    </div>

                    <div className={`text-center relative z-10 transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'
                        }`}>
                        <div className="text-6xl font-bold text-primary mb-2 transition-colors">
                            {specs.aro}"
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                            {specs.largura}/{specs.perfil}R{specs.aro}
                        </div>
                    </div>
                </div>
            </Link>

            <CardContent className="p-4">
                <Link href={`/produto/${slug}`}>
                    <h3 className="font-semibold mb-2 hover:text-primary transition-colors line-clamp-2">
                        {nome}
                    </h3>
                </Link>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge
                        variant="secondary"
                        className="transition-all duration-300 hover:scale-105 hover:bg-primary/20"
                    >
                        {specs.marca}
                    </Badge>
                    <Badge
                        variant="outline"
                        className="transition-all duration-300 hover:scale-105 hover:border-primary"
                    >
                        Sulco: {specs.sulco}
                    </Badge>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${estoque > 5 ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                        Estoque: {estoque} {estoque === 1 ? 'unidade' : 'unidades'}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex items-center justify-between">
                <div>
                    <div className="text-2xl font-bold text-primary transition-transform duration-300 group-hover:scale-110 inline-block">
                        {formatPrice(preco)}
                    </div>
                </div>
                <Button
                    size="sm"
                    className="group/btn relative overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50"
                >
                    <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
                    <span className="relative z-10">Adicionar</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
            </CardFooter>
        </Card>
    )
}
