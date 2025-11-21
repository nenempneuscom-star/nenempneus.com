'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCarrinhoStore } from '@/lib/store/carrinho-store'
import { formatPrice } from '@/lib/utils'

export function ResumoPedido() {
    const { items, getSubtotal, getTotalItems } = useCarrinhoStore()

    const subtotal = getSubtotal()
    const totalItems = getTotalItems()

    return (
        <Card className="sticky top-4">
            <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <div className="flex-1">
                                <span className="font-medium">{item.nome}</span>
                                <span className="text-muted-foreground ml-2">
                                    x{item.quantidade}
                                </span>
                            </div>
                            <span className="font-medium">
                                {formatPrice(item.preco * item.quantidade)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
                        </span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Desconto</span>
                        <span>R$ 0,00</span>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span className="text-primary">{formatPrice(subtotal)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
