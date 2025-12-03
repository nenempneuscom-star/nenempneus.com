'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, Phone, Mail, RefreshCcw } from 'lucide-react'

export default function PedidoFalhaPage() {
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                        <XCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2">Pagamento Não Aprovado</h1>
                    <p className="text-muted-foreground text-lg">
                        Houve um problema ao processar seu pagamento
                    </p>
                </div>

                <Card className="mb-6 border-red-500/50 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-900">
                            O que aconteceu?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-red-800">
                            <li>• Pagamento recusado pela operadora do cartão</li>
                            <li>• Saldo insuficiente</li>
                            <li>• Dados do cartão incorretos</li>
                            <li>• Limite de crédito excedido</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>O que fazer agora?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <RefreshCcw className="h-4 w-4 text-primary" />
                                Tente Novamente
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Você pode tentar realizar o pedido novamente usando outro método de pagamento ou cartão.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Entre em Contato</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-primary" />
                                    <span>(48) 99997-3889</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-primary" />
                                    <span>contato@nenempneus.com</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-4">
                    <Button asChild>
                        <Link href="/carrinho">
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Tentar Novamente
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/catalogo">Continuar Comprando</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
