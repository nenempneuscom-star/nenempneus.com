'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Check, MapPin, Shield, Minus, Plus, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCarrinhoStore } from '@/lib/store/carrinho-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProdutoDetalhesProps {
    produto: any
}

export function ProdutoDetalhes({ produto }: ProdutoDetalhesProps) {
    const router = useRouter()
    const [quantidade, setQuantidade] = useState(1)
    const [parcelasMaximas, setParcelasMaximas] = useState(12)
    const [taxaJuros, setTaxaJuros] = useState(0)
    const [imagemAtual, setImagemAtual] = useState(0)
    const { adicionarItem } = useCarrinhoStore()

    // Combina imagens array com imagemUrl para compatibilidade
    const imagens: string[] = produto.imagens?.length > 0
        ? produto.imagens
        : (produto.imagemUrl ? [produto.imagemUrl] : [])

    const specs = produto.specs as any
    const veiculos = produto.veiculos as any[]

    // Buscar configurações de parcelamento
    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch('/api/settings')
                if (res.ok) {
                    const data = await res.json()
                    setParcelasMaximas(data.parcelasMaximas || 12)
                    setTaxaJuros(Number(data.taxaJuros) || 0)
                }
            } catch (error) {
                console.error('Erro ao buscar settings:', error)
            }
        }
        fetchSettings()
    }, [])

    const valorParcela = (Number(produto.preco) * quantidade) / parcelasMaximas

    const handleAdicionarCarrinho = () => {
        adicionarItem(
            {
                id: produto.id,
                nome: produto.nome,
                slug: produto.slug,
                preco: Number(produto.preco),
                specs: produto.specs,
                imagemUrl: produto.imagemUrl || undefined,
            },
            quantidade
        )

        // GTM Event: add_to_cart
        if (typeof window !== 'undefined' && (window as any).dataLayer) {
            (window as any).dataLayer.push({
                event: 'add_to_cart',
                ecommerce: {
                    currency: 'BRL',
                    value: Number(produto.preco) * quantidade,
                    items: [{
                        item_id: produto.id,
                        item_name: produto.nome,
                        item_brand: specs.marca,
                        item_category: produto.categoria.nome,
                        price: Number(produto.preco),
                        quantity: quantidade
                    }]
                }
            })
        }

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
                imagemUrl: produto.imagemUrl || undefined,
            },
            quantidade
        )
        router.push('/carrinho')
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Imagem/Visualização */}
            <div className="space-y-3">
                <div className="relative aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {imagens.length > 0 ? (
                        <>
                            <img
                                src={imagens[imagemAtual]}
                                alt={`${produto.nome} - Foto ${imagemAtual + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {/* Setas de navegação */}
                            {imagens.length > 1 && (
                                <>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                                        onClick={() => setImagemAtual(prev => prev === 0 ? imagens.length - 1 : prev - 1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                                        onClick={() => setImagemAtual(prev => prev === imagens.length - 1 ? 0 : prev + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    {/* Indicadores */}
                                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                        {imagemAtual + 1} / {imagens.length}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="text-center p-8">
                            <div className="text-9xl font-bold text-primary mb-4">
                                {specs.aro}"
                            </div>
                            <div className="text-2xl text-muted-foreground">
                                {specs.largura}/{specs.perfil}R{specs.aro}
                            </div>
                        </div>
                    )}
                    {/* Aviso discreto */}
                    <span className="absolute bottom-3 left-3 text-[11px] text-muted-foreground/50">
                        *Imagem ilustrativa
                    </span>
                </div>

                {/* Miniaturas */}
                {imagens.length > 1 && (
                    <div className="flex gap-2 justify-center">
                        {imagens.map((img, index) => (
                            <button
                                key={index}
                                onClick={() => setImagemAtual(index)}
                                className={cn(
                                    "w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                                    imagemAtual === index
                                        ? "border-primary ring-2 ring-primary/30"
                                        : "border-muted hover:border-muted-foreground/50"
                                )}
                            >
                                <img
                                    src={img}
                                    alt={`${produto.nome} - Miniatura ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
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
                            ou {parcelasMaximas}x de {formatPrice(valorParcela)} {taxaJuros === 0 ? 'sem juros' : `(${taxaJuros}% a.m.)`}
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
