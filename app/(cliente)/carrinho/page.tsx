'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCarrinhoStore } from '@/lib/store/carrinho-store'
import { CarrinhoItem } from '@/components/cliente/CarrinhoItem'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, ArrowRight } from 'lucide-react'

export default function CarrinhoPage() {
    const { items, getSubtotal, getTotalItems } = useCarrinhoStore()

    const subtotal = getSubtotal()
    const totalItems = getTotalItems()

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <ShoppingCart className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
                    <h1 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h1>
                    <p className="text-muted-foreground mb-8">
                        Adicione produtos ao carrinho para continuar
                    </p>
                    <Button asChild size="lg">
                        <Link href="/catalogo">Ver Produtos</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-8">Carrinho de Compras</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Items */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <CarrinhoItem key={item.id} item={item} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Resumo */}
                <div>
                    <Card className="sticky top-4">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-semibold text-lg">Resumo do Pedido</h3>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Itens ({totalItems})
                                    </span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between text-lg font-semibold mb-4">
                                    <span>Total:</span>
                                    <span className="text-primary">{formatPrice(subtotal)}</span>
                                </div>

                                <Button asChild className="w-full" size="lg">
                                    <Link href="/checkout">
                                        Finalizar Compra
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                            </div>

                            <Button asChild variant="outline" className="w-full">
                                <Link href="/catalogo">Continuar Comprando</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
