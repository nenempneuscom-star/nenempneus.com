'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCarrinhoStore, SERVICOS_DISPONIVEIS } from '@/lib/store/carrinho-store'
import { formatPrice } from '@/lib/utils'
import { Wrench } from 'lucide-react'

export function ResumoPedido() {
    const { items, servicos, getSubtotal, getTotalItems, getTotalServicos, getTotal } = useCarrinhoStore()

    const subtotal = getSubtotal()
    const totalItems = getTotalItems()
    const totalServicos = getTotalServicos()
    const total = getTotal()

    // Pegar detalhes dos serviços selecionados
    const servicosSelecionados = SERVICOS_DISPONIVEIS.filter(s => servicos.includes(s.id))

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

                {/* Serviços */}
                {servicosSelecionados.length > 0 && (
                    <div className="border-t pt-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Wrench className="h-4 w-4" />
                            Serviços
                        </div>
                        {servicosSelecionados.map((servico) => (
                            <div key={servico.id} className="flex justify-between text-sm">
                                <span className="font-medium">{servico.nome}</span>
                                <span className="font-medium">{formatPrice(servico.preco)}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            Pneus ({totalItems} {totalItems === 1 ? 'unidade' : 'unidades'})
                        </span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>

                    {totalServicos > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Serviços ({servicosSelecionados.length})
                            </span>
                            <span>{formatPrice(totalServicos)}</span>
                        </div>
                    )}
                </div>

                <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
