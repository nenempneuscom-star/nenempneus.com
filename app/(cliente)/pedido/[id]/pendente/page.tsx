'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, AlertCircle, Copy, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

const POLLING_INTERVAL = 5000 // 5 segundos
const MAX_POLLING_TIME = 30 * 60 * 1000 // 30 minutos

export default function PedidoPendentePage() {
    const params = useParams()
    const router = useRouter()
    const [pedido, setPedido] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [pixCode, setPixCode] = useState<string | null>(null)
    const [statusPagamento, setStatusPagamento] = useState<'pending' | 'approved' | 'rejected'>('pending')
    const [tempoRestante, setTempoRestante] = useState<number | null>(null)
    const pollingStartTime = useRef<number>(Date.now())
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    const fetchPedido = useCallback(async () => {
        try {
            const response = await fetch(`/api/pedidos/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                setPedido(data.pedido)

                // Verificar status do pedido
                if (data.pedido.status === 'pago') {
                    setStatusPagamento('approved')
                    toast.success('Pagamento confirmado!', {
                        description: 'Redirecionando para página de sucesso...'
                    })
                    // Limpar polling e redirecionar
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current)
                    }
                    setTimeout(() => {
                        router.push(`/pedido/${params.id}/sucesso`)
                    }, 2000)
                    return
                }

                if (data.pedido.status === 'cancelado') {
                    setStatusPagamento('rejected')
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current)
                    }
                    return
                }

                // Buscar código PIX se houver pagamento pendente
                const pagamentoPendente = data.pedido.pagamentos?.find(
                    (p: any) => p.status === 'pending' && p.metodo === 'pix'
                )

                if (pagamentoPendente?.pixCode) {
                    setPixCode(pagamentoPendente.pixCode)
                }

                // Verificar também o status do pagamento diretamente
                const ultimoPagamento = data.pedido.pagamentos?.[data.pedido.pagamentos.length - 1]
                if (ultimoPagamento?.status === 'approved') {
                    setStatusPagamento('approved')
                    toast.success('Pagamento confirmado!')
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current)
                    }
                    setTimeout(() => {
                        router.push(`/pedido/${params.id}/sucesso`)
                    }, 2000)
                }
            }
        } catch (error) {
            console.error('Erro ao buscar pedido:', error)
        } finally {
            setLoading(false)
        }
    }, [params.id, router])

    // Polling para verificar status do pagamento
    useEffect(() => {
        if (params.id) {
            fetchPedido()

            // Iniciar polling
            pollingRef.current = setInterval(() => {
                const elapsed = Date.now() - pollingStartTime.current

                // Parar polling após 30 minutos
                if (elapsed > MAX_POLLING_TIME) {
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current)
                    }
                    return
                }

                fetchPedido()
            }, POLLING_INTERVAL)

            return () => {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current)
                }
            }
        }
    }, [params.id, fetchPedido])

    // Contador de tempo restante para o PIX (30 min)
    useEffect(() => {
        const timer = setInterval(() => {
            const elapsed = Date.now() - pollingStartTime.current
            const restante = Math.max(0, MAX_POLLING_TIME - elapsed)
            setTempoRestante(restante)
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const copiarPix = () => {
        if (pixCode) {
            navigator.clipboard.writeText(pixCode)
            toast.success('Código PIX copiado!')
        } else {
            toast.info('Aguarde a geração do código PIX...')
        }
    }

    const formatarTempo = (ms: number) => {
        const minutos = Math.floor(ms / 60000)
        const segundos = Math.floor((ms % 60000) / 1000)
        return `${minutos}:${segundos.toString().padStart(2, '0')}`
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    // Se pagamento foi aprovado, mostrar tela de sucesso temporária
    if (statusPagamento === 'approved') {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-pulse">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2 text-green-700">Pagamento Confirmado!</h1>
                    <p className="text-muted-foreground text-lg mb-4">
                        Redirecionando para página de sucesso...
                    </p>
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
                        <Clock className="h-10 w-10 text-yellow-600" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2">Pagamento Pendente</h1>
                    <p className="text-muted-foreground text-lg">
                        Aguardando confirmação do pagamento
                    </p>
                    {/* Indicador de verificação automática */}
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verificando pagamento automaticamente...</span>
                    </div>
                    {tempoRestante !== null && tempoRestante > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Tempo para expiração do PIX: {formatarTempo(tempoRestante)}
                        </p>
                    )}
                </div>

                <Card className="mb-6 border-yellow-500/50 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-900">
                            <AlertCircle className="h-5 w-5" />
                            Pagamento via PIX
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-yellow-800 mb-4">
                            Para concluir sua compra, realize o pagamento via PIX usando o QR Code ou copiando o código abaixo.
                        </p>
                        <div className="bg-white p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-muted-foreground mb-2">Código PIX:</p>
                            {pixCode ? (
                                <div className="flex gap-2">
                                    <code className="flex-1 text-sm bg-gray-50 p-2 rounded border overflow-x-auto">
                                        {pixCode}
                                    </code>
                                    <Button size="sm" onClick={copiarPix}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground bg-gray-50 p-4 rounded border">
                                    <p className="mb-2">Código PIX em processamento...</p>
                                    <p className="text-xs">
                                        Se você escolheu PIX no Mercado Pago, o código será exibido na próxima tela.
                                        Caso contrário, você pode finalizar o pagamento diretamente no Mercado Pago.
                                    </p>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-yellow-700 mt-4">
                            Após a confirmação do pagamento, você receberá um e-mail e WhatsApp com os detalhes do seu pedido.
                        </p>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-4">
                    <Button asChild>
                        <Link href="/minha-conta/pedidos">Ver Meus Pedidos</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/">Voltar ao Início</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
