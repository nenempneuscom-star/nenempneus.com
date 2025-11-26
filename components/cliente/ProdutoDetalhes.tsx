'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Check, MapPin, Shield, Minus, Plus, Zap } from 'lucide-react'
import { useCarrinhoStore } from '@/lib/store/carrinho-store'
import { toast } from 'sonner'

interface ProdutoDetalhesProps {
    produto: any
}

export function ProdutoDetalhes({ produto }: ProdutoDetalhesProps) {
    const router = useRouter()
    const [quantidade, setQuantidade] = useState(1)
    const { adicionarItem } = useCarrinhoStore()

    const specs = produto.specs as any
    const veiculos = produto.veiculos as any[]

    // Parcelamento (valores de exemplo - devem vir do admin)
    const parcelas = 12
    const taxaJuros = 0 // Taxa de exemplo
    const valorParcela = (Number(produto.preco) * quantidade) / parcelas

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

        // Feedback com toast
        toast.success(`${quantidade} ${quantidade === 1 ? 'unidade' : 'unidades'} adicionada(s)!`, {
            description: produto.nome,
            action: {
                label: 'Ver Carrinho',
                onClick: () => router.push('/carrinho')
            }
        })
    }

    const handleComprarAgora = () => {
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
        router.push('/carrinho')
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Imagem/Visualização */}
            <div>
                <div className="relative aspect-square bg-muted rounded-lg flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="text-9xl font-bold text-primary mb-4">
                            {specs.aro}"
                        </div>
                        <div className="text-2xl text-muted-foreground">
                            {specs.largura}/{specs.perfil}R{specs.aro}
                        </div>
                    </div>
                    {/* Aviso discreto */}
                    <span className="absolute bottom-3 left-3 text-[11px] text-muted-foreground/50">
                        *Imagem ilustrativa
                    </span>
                </div>
            </div>

            {/* Informações */}
            <div className="space-y-4">
                {/* Título e Categoria */}
                <div>
                    <Badge className="mb-2">{produto.categoria.nome}</Badge>
                    <h1 className="text-3xl font-bold mb-1">{produto.nome}</h1>
                    <p className="text-sm text-muted-foreground">{produto.descricao}</p>
                </div>

                {/* Especificações */}
                <Card>
                    <CardContent className="pt-4">
                        <h3 className="font-semibold mb-3 text-sm">Especificações Técnicas</h3>
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
                        <CardContent className="pt-4">
                            <h3 className="font-semibold mb-3 text-sm">Veículos Compatíveis</h3>
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
                <div className="space-y-3 pt-2 border-t">
                    <div>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-4xl font-bold text-primary">
                                {formatPrice(Number(produto.preco) * quantidade)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {quantidade > 1 ? `(${formatPrice(Number(produto.preco))} cada)` : 'por unidade'}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            ou {parcelas}x de {formatPrice(valorParcela)} {taxaJuros === 0 ? 'sem juros' : `(${taxaJuros}% a.m.)`}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 font-medium">
                            {produto.estoque} unidades disponíveis
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

                    {/* Botões */}
                    <div className="flex gap-3">
                        <Button
                            size="lg"
                            variant="outline"
                            className="flex-1"
                            onClick={handleAdicionarCarrinho}
                            disabled={produto.estoque <= 0}
                        >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Adicionar
                        </Button>
                        <Button
                            size="lg"
                            className="flex-1"
                            onClick={handleComprarAgora}
                            disabled={produto.estoque <= 0}
                        >
                            <Zap className="h-5 w-5 mr-2" />
                            Comprar Agora
                        </Button>
                    </div>

                    {/* Benefícios */}
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-5 w-5 text-primary" />
                            <span>Instalação em nossa loja</span>
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
