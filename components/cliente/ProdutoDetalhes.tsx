'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Check, Truck, Shield, Minus, Plus } from 'lucide-react'
import { useCarrinhoStore } from '@/lib/store/carrinho-store'

interface ProdutoDetalhesProps {
    produto: any
}

export function ProdutoDetalhes({ produto }: ProdutoDetalhesProps) {
    const [quantidade, setQuantidade] = useState(1)
    const { adicionarItem } = useCarrinhoStore()

    const specs = produto.specs as any
    const veiculos = produto.veiculos as any[]

    const handleAdicionarCarrinho = () => {
        adicionarItem(
            {
                id: produto.id,
                nome: produto.nome,
                slug: produto.slug,
                preco: Number(produto.preco),
                specs: produto.specs,
            },
            quantidade
        )

        // Reset quantidade
        setQuantidade(1)

        // Feedback visual
        alert(`${quantidade} ${quantidade === 1 ? 'unidade' : 'unidades'} adicionada(s) ao carrinho!`)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Imagem/Visualização */}
            <div>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center p-12">
                    <div className="text-center">
                        <div className="text-9xl font-bold text-primary mb-4">
                            {specs.aro}"
                        </div>
                        <div className="text-2xl text-muted-foreground">
                            {specs.largura}/{specs.perfil}R{specs.aro}
                        </div>
                    </div>
                </div>
            </div>

            {/* Informações */}
            <div className="space-y-6">
                {/* Título e Categoria */}
                <div>
                    <Badge className="mb-2">{produto.categoria.nome}</Badge>
                    <h1 className="text-4xl font-bold mb-2">{produto.nome}</h1>
                    <p className="text-muted-foreground">{produto.descricao}</p>
                </div>

                {/* Especificações */}
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="font-semibold mb-4">Especificações Técnicas</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Marca:</span>
                                <span className="ml-2 font-medium">{specs.marca}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Modelo:</span>
                                <span className="ml-2 font-medium">{specs.modelo}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Aro:</span>
                                <span className="ml-2 font-medium">{specs.aro}"</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Largura:</span>
                                <span className="ml-2 font-medium">{specs.largura}mm</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Perfil:</span>
                                <span className="ml-2 font-medium">{specs.perfil}%</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Sulco:</span>
                                <span className="ml-2 font-medium">{specs.sulco}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Veículos Compatíveis */}
                {veiculos && veiculos.length > 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-4">Veículos Compatíveis</h3>
                            <div className="space-y-2">
                                {veiculos.map((veiculo: any, index: number) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span>
                                            {veiculo.marca} {veiculo.modelo} ({veiculo.anos.join(', ')})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Preço e Ações */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-primary">
                            {formatPrice(Number(produto.preco))}
                        </span>
                        <span className="text-sm text-muted-foreground">por unidade</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>
                            {produto.estoque} unidades em estoque
                        </span>
                    </div>

                    {/* Quantidade */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Quantidade:</span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center">{quantidade}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setQuantidade(Math.min(produto.estoque, quantidade + 1))}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Botão Adicionar */}
                    <Button size="lg" className="w-full" onClick={handleAdicionarCarrinho}>
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Adicionar ao Carrinho
                    </Button>

                    {/* Benefícios */}
                    <div className="space-y-3 pt-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Truck className="h-5 w-5 text-primary" />
                            <span>Entrega rápida para sua região</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Shield className="h-5 w-5 text-primary" />
                            <span>Garantia de qualidade</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
