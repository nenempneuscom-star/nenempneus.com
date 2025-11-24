'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useCarrinhoStore, SERVICOS_DISPONIVEIS } from '@/lib/store/carrinho-store'
import { CarrinhoItem } from '@/components/cliente/CarrinhoItem'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, ArrowRight, Wrench, CircleDot } from 'lucide-react'

export default function CarrinhoPage() {
    const { items, servicos, getSubtotal, getTotalItems, getTotalServicos, getTotal, toggleServico } = useCarrinhoStore()

    const subtotal = getSubtotal()
    const totalItems = getTotalItems()
    const totalServicos = getTotalServicos()
    const total = getTotal()

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
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <CarrinhoItem key={item.id} item={item} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upsell de Serviços */}
                    <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Wrench className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">Serviços Adicionais</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                Aproveite e inclua serviços essenciais para seus pneus novos!
                            </p>
                            <div className="space-y-3">
                                {SERVICOS_DISPONIVEIS.map((servico) => {
                                    const isSelected = servicos.includes(servico.id)
                                    return (
                                        <div
                                            key={servico.id}
                                            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border hover:border-primary/50 bg-background'
                                            }`}
                                            onClick={() => toggleServico(servico.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleServico(servico.id)}
                                                    className="pointer-events-none"
                                                />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <CircleDot className="h-4 w-4 text-primary" />
                                                        <span className="font-medium">{servico.nome}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{servico.descricao}</p>
                                                </div>
                                            </div>
                                            <span className={`font-semibold ${isSelected ? 'text-primary' : ''}`}>
                                                {formatPrice(servico.preco)}
                                            </span>
                                        </div>
                                    )
                                })}
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
                                        Pneus ({totalItems})
                                    </span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                {totalServicos > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Serviços ({servicos.length})
                                        </span>
                                        <span>{formatPrice(totalServicos)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between text-lg font-semibold mb-4">
                                    <span>Total:</span>
                                    <span className="text-primary">{formatPrice(total)}</span>
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
