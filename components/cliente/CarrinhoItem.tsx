'use client'

import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { Minus, Plus, X } from 'lucide-react'
import { useCarrinhoStore, ItemCarrinho } from '@/lib/store/carrinho-store'

interface CarrinhoItemProps {
    item: ItemCarrinho
}

export function CarrinhoItem({ item }: CarrinhoItemProps) {
    const { atualizarQuantidade, removerItem } = useCarrinhoStore()

    return (
        <div className="flex gap-4 py-4 border-b">
            {/* Imagem/Ícone */}
            <div className="w-20 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                        {item.specs.aro}"
                    </div>
                </div>
            </div>

            {/* Informações */}
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1 truncate">{item.nome}</h4>
                <p className="text-xs text-muted-foreground mb-2">
                    {item.specs.largura}/{item.specs.perfil}R{item.specs.aro}
                </p>
                <div className="text-sm font-semibold text-primary">
                    {formatPrice(item.preco)}
                </div>
            </div>

            {/* Quantidade */}
            <div className="flex flex-col items-end gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removerItem(item.id)}
                >
                    <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantidade}</span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
