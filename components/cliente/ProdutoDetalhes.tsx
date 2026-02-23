'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Check, MapPin, Shield, Minus, Plus, Zap, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
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
    const [lightboxAberto, setLightboxAberto] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const panStart = useRef({ x: 0, y: 0 })
    const panOffset = useRef({ x: 0, y: 0 })
    const lastPinchDist = useRef(0)
    const lightboxImgRef = useRef<HTMLDivElement>(null)
    const MIN_ZOOM = 1
    const MAX_ZOOM = 4
    const { adicionarItem } = useCarrinhoStore()

    // Combina imagens array com imagemUrl para compatibilidade
    const imagens: string[] = produto.imagens?.length > 0
        ? produto.imagens
        : (produto.imagemUrl ? [produto.imagemUrl] : [])

    const specs = produto.specs as any
    const veiculos = produto.veiculos as any[]

    const resetZoom = useCallback(() => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }, [])

    const closeLightbox = useCallback(() => {
        setLightboxAberto(false)
        resetZoom()
    }, [resetZoom])

    const clampZoom = useCallback((z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)), [])

    // Fechar lightbox com ESC, navegar com setas, zoom com +/-
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxAberto) return
            if (e.key === 'Escape') closeLightbox()
            if (e.key === 'ArrowLeft' && zoom === 1) {
                setImagemAtual(prev => prev === 0 ? imagens.length - 1 : prev - 1)
            }
            if (e.key === 'ArrowRight' && zoom === 1) {
                setImagemAtual(prev => prev === imagens.length - 1 ? 0 : prev + 1)
            }
            if (e.key === '+' || e.key === '=') {
                setZoom(prev => clampZoom(prev + 0.5))
            }
            if (e.key === '-') {
                const newZoom = clampZoom(zoom - 0.5)
                setZoom(newZoom)
                if (newZoom === 1) setPan({ x: 0, y: 0 })
            }
            if (e.key === '0') resetZoom()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [lightboxAberto, imagens.length, zoom, closeLightbox, clampZoom, resetZoom])

    // Scroll para zoom no lightbox
    useEffect(() => {
        if (!lightboxAberto) return
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            const delta = e.deltaY > 0 ? -0.3 : 0.3
            setZoom(prev => {
                const newZoom = clampZoom(prev + delta)
                if (newZoom === 1) setPan({ x: 0, y: 0 })
                return newZoom
            })
        }
        window.addEventListener('wheel', handleWheel, { passive: false })
        return () => window.removeEventListener('wheel', handleWheel)
    }, [lightboxAberto, clampZoom])

    // Touch handlers para pinch-to-zoom e pan
    useEffect(() => {
        if (!lightboxAberto) return
        const el = lightboxImgRef.current
        if (!el) return

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault()
                const dx = e.touches[0].clientX - e.touches[1].clientX
                const dy = e.touches[0].clientY - e.touches[1].clientY
                lastPinchDist.current = Math.hypot(dx, dy)
            } else if (e.touches.length === 1 && zoom > 1) {
                setIsPanning(true)
                panStart.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y }
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault()
                const dx = e.touches[0].clientX - e.touches[1].clientX
                const dy = e.touches[0].clientY - e.touches[1].clientY
                const dist = Math.hypot(dx, dy)
                if (lastPinchDist.current > 0) {
                    const scale = dist / lastPinchDist.current
                    setZoom(prev => {
                        const newZoom = clampZoom(prev * scale)
                        if (newZoom === 1) setPan({ x: 0, y: 0 })
                        return newZoom
                    })
                }
                lastPinchDist.current = dist
            } else if (e.touches.length === 1 && isPanning && zoom > 1) {
                e.preventDefault()
                setPan({
                    x: e.touches[0].clientX - panStart.current.x,
                    y: e.touches[0].clientY - panStart.current.y
                })
            }
        }

        const handleTouchEnd = () => {
            lastPinchDist.current = 0
            setIsPanning(false)
        }

        el.addEventListener('touchstart', handleTouchStart, { passive: false })
        el.addEventListener('touchmove', handleTouchMove, { passive: false })
        el.addEventListener('touchend', handleTouchEnd)
        return () => {
            el.removeEventListener('touchstart', handleTouchStart)
            el.removeEventListener('touchmove', handleTouchMove)
            el.removeEventListener('touchend', handleTouchEnd)
        }
    }, [lightboxAberto, zoom, isPanning, pan, clampZoom])

    // Mouse drag to pan
    useEffect(() => {
        if (!lightboxAberto || zoom <= 1) return

        const handleMouseDown = (e: MouseEvent) => {
            if (!(e.target as HTMLElement)?.closest('[data-lightbox-img]')) return
            e.preventDefault()
            setIsPanning(true)
            panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!isPanning) return
            setPan({
                x: e.clientX - panStart.current.x,
                y: e.clientY - panStart.current.y
            })
        }

        const handleMouseUp = () => setIsPanning(false)

        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [lightboxAberto, zoom, isPanning, pan])

    // Reset zoom when changing image
    useEffect(() => {
        resetZoom()
    }, [imagemAtual, resetZoom])

    // Bloquear scroll do body quando lightbox está aberto
    useEffect(() => {
        if (lightboxAberto) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [lightboxAberto])

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

    // Calcular valor total com juros (preço à vista + acréscimo de juros por parcela)
    const precoBase = Number(produto.preco) * quantidade
    const valorTotalComJuros = taxaJuros > 0
        ? precoBase * (1 + (taxaJuros / 100) * parcelasMaximas)
        : precoBase
    const valorParcela = valorTotalComJuros / parcelasMaximas

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
                            {/* Imagem clicável para ampliar */}
                            <button
                                onClick={() => setLightboxAberto(true)}
                                className="w-full h-full cursor-zoom-in group"
                            >
                                <img
                                    src={imagens[imagemAtual]}
                                    alt={`${produto.nome} - Foto ${imagemAtual + 1}`}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                {/* Ícone de zoom */}
                                <div className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ZoomIn className="h-4 w-4" />
                                </div>
                            </button>
                            {/* Setas de navegação */}
                            {imagens.length > 1 && (
                                <>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 z-10"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setImagemAtual(prev => prev === 0 ? imagens.length - 1 : prev - 1)
                                        }}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 z-10"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setImagemAtual(prev => prev === imagens.length - 1 ? 0 : prev + 1)
                                        }}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    {/* Indicadores */}
                                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
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
                    <span className="absolute bottom-3 left-3 text-[11px] text-muted-foreground/50 z-10">
                        *Imagem ilustrativa
                    </span>
                    {/* Dica de clique */}
                    {imagens.length > 0 && (
                        <span className="absolute top-3 left-3 text-[10px] text-white/70 bg-black/40 px-2 py-1 rounded">
                            Clique para ampliar
                        </span>
                    )}
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
                        <div className="text-sm text-green-600 font-medium">
                            à vista no PIX
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            ou {parcelasMaximas}x de {formatPrice(valorParcela)} no cartão
                            {taxaJuros > 0 && ` (total: ${formatPrice(valorTotalComJuros)})`}
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

            {/* Lightbox Modal com Zoom Interativo */}
            {lightboxAberto && imagens.length > 0 && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                    onClick={() => zoom === 1 && closeLightbox()}
                >
                    {/* Botão fechar */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
                        onClick={closeLightbox}
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    {/* Controles de zoom */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
                        {imagens.length > 1 && (
                            <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full mr-2">
                                {imagemAtual + 1} / {imagens.length}
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 h-8 w-8"
                            onClick={(e) => {
                                e.stopPropagation()
                                const newZoom = clampZoom(zoom - 0.5)
                                setZoom(newZoom)
                                if (newZoom === 1) setPan({ x: 0, y: 0 })
                            }}
                            disabled={zoom <= MIN_ZOOM}
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full min-w-[3rem] text-center">
                            {zoom.toFixed(1)}x
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 h-8 w-8"
                            onClick={(e) => {
                                e.stopPropagation()
                                setZoom(prev => clampZoom(prev + 0.5))
                            }}
                            disabled={zoom >= MAX_ZOOM}
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        {zoom > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20 h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    resetZoom()
                                }}
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Imagem principal com zoom */}
                    <div
                        ref={lightboxImgRef}
                        data-lightbox-img
                        className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center overflow-hidden"
                        style={{
                            cursor: zoom >= MAX_ZOOM ? 'zoom-out' : zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in'
                        }}
                        onClick={(e) => {
                            e.stopPropagation()
                            if (isPanning) return
                            if (zoom === 1) {
                                setZoom(2)
                            } else {
                                resetZoom()
                            }
                        }}
                        onDoubleClick={(e) => {
                            e.stopPropagation()
                            resetZoom()
                        }}
                    >
                        <img
                            src={imagens[imagemAtual]}
                            alt={`${produto.nome} - Foto ${imagemAtual + 1}`}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
                            style={{
                                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                                transition: isPanning ? 'none' : 'transform 0.2s ease-out',
                                pointerEvents: 'none'
                            }}
                            draggable={false}
                        />
                    </div>

                    {/* Setas de navegação (só quando não está em zoom) */}
                    {imagens.length > 1 && zoom === 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setImagemAtual(prev => prev === 0 ? imagens.length - 1 : prev - 1)
                                }}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setImagemAtual(prev => prev === imagens.length - 1 ? 0 : prev + 1)
                                }}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>
                        </>
                    )}

                    {/* Miniaturas no lightbox (só quando não está em zoom) */}
                    {imagens.length > 1 && zoom === 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {imagens.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setImagemAtual(index)
                                    }}
                                    className={cn(
                                        "w-14 h-14 rounded-md overflow-hidden border-2 transition-all",
                                        imagemAtual === index
                                            ? "border-white ring-2 ring-white/50"
                                            : "border-white/30 hover:border-white/60 opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <img
                                        src={img}
                                        alt={`Miniatura ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Dica de teclado */}
                    <div className="absolute bottom-4 right-4 text-white/50 text-xs hidden md:block">
                        {zoom > 1 ? 'Arraste para mover • Duplo-clique para resetar' : 'Scroll para zoom • Clique para ampliar • ESC para fechar'}
                    </div>
                </div>
            )}
        </div>
    )
}
