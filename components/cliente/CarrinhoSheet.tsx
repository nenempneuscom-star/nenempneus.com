'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { ShoppingCart } from 'lucide-react'
import { useCarrinhoStore } from '@/lib/store/carrinho-store'
import { CarrinhoItem } from './CarrinhoItem'
import { formatPrice } from '@/lib/utils'

export function CarrinhoSheet() {
    const { items, getTotalItems, getSubtotal } = useCarrinhoStore()

    const totalItems = getTotalItems()
    const subtotal = getSubtotal()

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Carrinho
                    {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {totalItems}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Carrinho de Compras</SheetTitle>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">Seu carrinho está vazio</p>
                        <Button asChild>
                            <Link href="/catalogo">Ver Produtos</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Items */}
                        <div className="flex-1 overflow-auto py-4">
                            {items.map((item) => (
                                <CarrinhoItem key={item.id} item={item} />
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t pt-4 space-y-4">
                            <div className="flex justify-between text-lg font-semibold">
                                <span>Subtotal:</span>
                                <span className="text-primary">{formatPrice(subtotal)}</span>
                            </div>
                            <Button asChild className="w-full" size="lg">
                                <Link href="/carrinho">Ver Carrinho Completo</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
