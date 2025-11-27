'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    useCarrinhoStore,
    type GeometriaConfig,
    type BalanceamentoConfig,
    gerarDescricaoGeometria,
    gerarDescricaoBalanceamento,
} from '@/lib/store/carrinho-store'
import { CarrinhoItem } from '@/components/cliente/CarrinhoItem'
import { GeometriaConfigDialog } from '@/components/cliente/GeometriaConfigDialog'
import { BalanceamentoConfigDialog } from '@/components/cliente/BalanceamentoConfigDialog'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, ArrowRight, Wrench, CircleDot, Car, Settings2, Trash2, Edit } from 'lucide-react'

export default function CarrinhoPage() {
    const {
        items,
        servicos,
        getSubtotal,
        getTotalItems,
        getTotalServicos,
        getTotal,
        adicionarServico,
        removerServico,
    } = useCarrinhoStore()

    const [geometriaDialogOpen, setGeometriaDialogOpen] = useState(false)
    const [balanceamentoDialogOpen, setBalanceamentoDialogOpen] = useState(false)

    const subtotal = getSubtotal()
    const totalItems = getTotalItems()
    const totalServicos = getTotalServicos()
    const total = getTotal()

    const geometriaConfig = servicos.find((s) => s.id === 'geometria')
    const balanceamentoConfig = servicos.find((s) => s.id === 'balanceamento')

    const handleGeometriaConfirm = (config: GeometriaConfig, preco: number, descricao: string) => {
        adicionarServico({
            id: 'geometria',
            config,
            preco,
        })
    }

    const handleBalanceamentoConfirm = (config: BalanceamentoConfig, preco: number, descricao: string) => {
        adicionarServico({
            id: 'balanceamento',
            config,
            preco,
        })
    }

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
        <>
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

                        {/* Serviços */}
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
                                    {/* Geometria */}
                                    <div className="border rounded-lg p-4 bg-background">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <Car className="h-5 w-5 text-primary mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="font-medium mb-1">Geometria</h4>
                                                    {geometriaConfig ? (
                                                        <div className="space-y-2">
                                                            <p className="text-sm text-muted-foreground">
                                                                {gerarDescricaoGeometria(geometriaConfig.config as GeometriaConfig)}
                                                            </p>
                                                            <p className="text-lg font-bold text-primary">
                                                                {formatPrice(geometriaConfig.preco)}
                                                            </p>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setGeometriaDialogOpen(true)}
                                                                >
                                                                    <Edit className="h-3 w-3 mr-1" />
                                                                    Editar
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removerServico('geometria')}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                                    Remover
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <p className="text-sm text-muted-foreground">
                                                                Alinhamento das rodas com preços a partir de R$ 60
                                                            </p>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => setGeometriaDialogOpen(true)}
                                                            >
                                                                <Settings2 className="h-3 w-3 mr-1" />
                                                                Configurar e Adicionar
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Balanceamento */}
                                    <div className="border rounded-lg p-4 bg-background">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <CircleDot className="h-5 w-5 text-primary mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="font-medium mb-1">Balanceamento</h4>
                                                    {balanceamentoConfig ? (
                                                        <div className="space-y-2">
                                                            <p className="text-sm text-muted-foreground">
                                                                {gerarDescricaoBalanceamento(balanceamentoConfig.config as BalanceamentoConfig)}
                                                            </p>
                                                            <p className="text-lg font-bold text-primary">
                                                                {formatPrice(balanceamentoConfig.preco)}
                                                            </p>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setBalanceamentoDialogOpen(true)}
                                                                >
                                                                    <Edit className="h-3 w-3 mr-1" />
                                                                    Editar
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removerServico('balanceamento')}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                                    Remover
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <p className="text-sm text-muted-foreground">
                                                                Balanceamento de rodas a partir de R$ 15 por roda
                                                            </p>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => setBalanceamentoDialogOpen(true)}
                                                            >
                                                                <Settings2 className="h-3 w-3 mr-1" />
                                                                Configurar e Adicionar
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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

                                    <Button
                                        asChild
                                        className="w-full"
                                        size="lg"
                                        onClick={() => {
                                            // GTM Event: begin_checkout
                                            if (typeof window !== 'undefined' && (window as any).dataLayer) {
                                                (window as any).dataLayer.push({
                                                    event: 'begin_checkout',
                                                    ecommerce: {
                                                        currency: 'BRL',
                                                        value: total,
                                                        items: items.map((item) => ({
                                                            item_id: item.id,
                                                            item_name: item.nome,
                                                            price: item.preco,
                                                            quantity: item.quantidade
                                                        }))
                                                    }
                                                })
                                            }
                                        }}
                                    >
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

            {/* Modais de Configuração */}
            <GeometriaConfigDialog
                open={geometriaDialogOpen}
                onOpenChange={setGeometriaDialogOpen}
                onConfirm={handleGeometriaConfirm}
                initialConfig={geometriaConfig?.config as GeometriaConfig}
            />

            <BalanceamentoConfigDialog
                open={balanceamentoDialogOpen}
                onOpenChange={setBalanceamentoDialogOpen}
                onConfirm={handleBalanceamentoConfirm}
                initialConfig={balanceamentoConfig?.config as BalanceamentoConfig}
            />
        </>
    )
}
