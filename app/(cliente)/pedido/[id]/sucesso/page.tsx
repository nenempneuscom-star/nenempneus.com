'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Calendar, MapPin, Phone, Mail, Loader2, Clock, Printer, FileText } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function PedidoSucessoPage() {
    const params = useParams()
    const [pedido, setPedido] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function buscarPedido() {
            try {
                const response = await fetch(`/api/pedidos/${params.id}`)
                if (!response.ok) throw new Error('Pedido não encontrado')
                const data = await response.json()
                setPedido(data.pedido)

                // GTM Event: purchase
                if (typeof window !== 'undefined' && (window as any).dataLayer) {
                    (window as any).dataLayer.push({
                        event: 'purchase',
                        ecommerce: {
                            transaction_id: data.pedido.numero,
                            value: data.pedido.total,
                            currency: 'BRL',
                            items: data.pedido.items?.map((item: any) => ({
                                item_id: item.id,
                                item_name: item.nome,
                                price: item.precoUnit,
                                quantity: item.quantidade
                            })) || []
                        }
                    })
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            buscarPedido()
        }
    }, [params.id])

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    if (!pedido) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Card className="max-w-2xl mx-auto text-center">
                    <CardContent className="p-8">
                        <h2 className="text-2xl font-bold mb-4">Pedido não encontrado</h2>
                        <Button asChild>
                            <Link href="/">Voltar ao Início</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl mx-auto">
                {/* Success Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2">Pedido Confirmado!</h1>
                    <p className="text-muted-foreground text-lg">
                        Seu pedido foi recebido e está sendo processado
                    </p>
                </div>

                {/* Order Details */}
                <Card className="mb-6">
                    <CardHeader className="bg-primary/5">
                        <CardTitle className="flex items-center justify-between">
                            <span>Pedido #{pedido.numero}</span>
                            <span className="text-base font-normal text-muted-foreground">
                                {pedido.createdAt && format(new Date(pedido.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {/* Items */}
                            <div>
                                <h3 className="font-semibold mb-3">Itens do Pedido</h3>
                                <div className="space-y-2">
                                    {pedido.items?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span>{item.nome} <span className="text-muted-foreground">x{item.quantidade}</span></span>
                                            <span className="font-medium">{formatPrice(item.subtotal)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Total:</span>
                                    <span className="text-primary">{formatPrice(pedido.total)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Agendamento */}
                {pedido.agendamento && (
                    <Card className="mb-6 border-primary/50 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Instalação Agendada
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                        {pedido.agendamento.data && format(new Date(pedido.agendamento.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{pedido.agendamento.hora && format(new Date(pedido.agendamento.hora), 'HH:mm')}</span>
                                </div>
                                <div className="flex items-start gap-2 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <MapPin className="h-4 w-4 text-yellow-600 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-yellow-900">A instalação será realizada em nossa loja</p>
                                        <p className="text-yellow-700 mt-1">Av. Nereu Ramos, 740, Sala 01<br/>Capivari de Baixo - SC, CEP: 88745-000</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Comprovante para Impressão */}
                <Card className="mb-6 border-blue-500/50 bg-blue-50 print:border-none print:bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <FileText className="h-5 w-5" />
                            Comprovante de Compra
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-white p-4 rounded-lg border border-blue-200 mb-4 print:border-none print:p-0">
                            <p className="text-sm text-blue-800 font-medium mb-2">
                                Apresente este comprovante na loja no dia da instalação
                            </p>
                            <p className="text-xs text-blue-600">
                                Você também pode mostrar o email de confirmação ou este comprovante pelo celular.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full border-blue-500 text-blue-700 hover:bg-blue-100 print:hidden"
                            onClick={() => window.print()}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir Comprovante
                        </Button>
                    </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="mb-6 print:hidden">
                    <CardHeader>
                        <CardTitle>Próximos Passos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="space-y-3 list-decimal list-inside">
                            <li className="text-sm">Você receberá uma confirmação por e-mail e WhatsApp</li>
                            <li className="text-sm"><strong>Imprima ou salve este comprovante</strong> para apresentar na loja</li>
                            <li className="text-sm">Compareça no horário agendado em nossa loja</li>
                            <li className="text-sm">Nossa equipe fará a instalação dos pneus</li>
                            <li className="text-sm">Em caso de dúvidas, entre em contato conosco</li>
                        </ol>
                    </CardContent>
                </Card>

                {/* Contact */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Precisa de Ajuda?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-primary" />
                            <span>(48) 99997-3889</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-primary" />
                            <span>contato@nenempneus.com</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild variant="outline" className="flex-1">
                        <Link href="/catalogo">Continuar Comprando</Link>
                    </Button>
                    <Button asChild className="flex-1">
                        <Link href="/minha-conta/pedidos">Ver Meus Pedidos</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
