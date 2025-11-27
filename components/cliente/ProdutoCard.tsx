'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Check, Zap, Flame, Tag } from 'lucide-react'
import { useState } from 'react'
import { useCarrinhoStore } from '@/lib/store/carrinho-store'
import { toast } from 'sonner'

interface ProdutoCardProps {
    id: string
    nome: string
    slug: string
    preco: number
    estoque: number
    specs: any
    imagemUrl?: string | null
    destaque?: 'mais-vendido' | 'oferta' | null
}

export function ProdutoCard({ id, nome, slug, preco, estoque, specs, imagemUrl, destaque }: ProdutoCardProps) {
    const router = useRouter()
    const [isHovered, setIsHovered] = useState(false)
    const [adicionado, setAdicionado] = useState(false)
    const adicionarItem = useCarrinhoStore((state) => state.adicionarItem)

    const handleAdicionarCarrinho = (e: React.MouseEvent) => {
        e.preventDefault()
        adicionarItem({ id, nome, slug, preco, specs })
        setAdicionado(true)
        toast.success('Produto adicionado ao carrinho!', {
            description: nome,
            action: {
                label: 'Ver Carrinho',
                onClick: () => router.push('/carrinho')
            }
        })
        setTimeout(() => setAdicionado(false), 2000)
    }

    const handleComprarAgora = (e: React.MouseEvent) => {
        e.preventDefault()
        adicionarItem({ id, nome, slug, preco, specs })
        router.push('/carrinho')
    }

    return (
        <Card
            className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 card-metallic metallic-shine"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={`/produto/${slug}`}>
                <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center p-8 overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Badge de Destaque */}
                    {destaque === 'mais-vendido' && (
                        <div className="absolute top-2 left-2 z-20 bg-orange-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
                            <Flame className="h-3 w-3" />
                            Mais Vendido
                        </div>
                    )}
                    {destaque === 'oferta' && (
                        <div className="absolute top-2 left-2 z-20 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Tag className="h-3 w-3" />
                            Oferta
                        </div>
                    )}

                    {imagemUrl ? (
                        /* Imagem real do produto */
                        <div className={`relative w-full h-full transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                            <Image
                                src={imagemUrl}
                                alt={nome}
                                fill
                                className="object-contain p-4"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    ) : (
                        /* Fallback: mostra o aro como ilustração */
                        <>
                            {/* Animated circle */}
                            <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                                <div className="w-32 h-32 rounded-full border-2 border-primary/20 group-hover:border-primary/40 transition-colors" />
                            </div>

                            <div className={`text-center relative z-10 transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                                <div className="text-6xl font-bold text-primary mb-2 transition-colors">
                                    {specs.aro}"
                                </div>
                                <div className="text-sm text-muted-foreground font-medium">
                                    {specs.largura}/{specs.perfil}R{specs.aro}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Aviso discreto - aparece em todos os casos */}
                    <span className="absolute bottom-2 left-2 text-[10px] text-muted-foreground/50">
                        *Imagem ilustrativa
                    </span>
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

            <CardFooter className="p-4 pt-0 flex flex-col gap-3">
                <div className="w-full flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold text-primary transition-transform duration-300 group-hover:scale-110 inline-block">
                            {formatPrice(preco)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            cada unidade
                        </div>
                    </div>
                </div>

                <div className="w-full flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:scale-105 transition-all duration-300"
                        onClick={handleAdicionarCarrinho}
                        disabled={estoque <= 0}
                    >
                        {adicionado ? (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Adicionado!
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Adicionar
                            </>
                        )}
                    </Button>

                    <Button
                        size="sm"
                        className="flex-1 group/btn relative overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50"
                        onClick={handleComprarAgora}
                        disabled={estoque <= 0}
                    >
                        <Zap className="h-4 w-4 mr-2 group-hover/btn:animate-pulse" />
                        <span className="relative z-10">Comprar</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
