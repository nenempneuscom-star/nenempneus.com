'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatPrice } from '@/lib/utils'
import {
    CreditCard,
    QrCode,
    Loader2,
    Copy,
    Check,
    AlertCircle,
    Shield,
    Lock,
    CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

declare global {
    interface Window {
        MercadoPago: any
    }
}

interface PagamentoTransparenteProps {
    pedidoNumero: string
    total: number
    payer: {
        email: string
        nome: string
        cpf?: string
    }
    onSuccess: () => void
    onError: (error: string) => void
}

type MetodoPagamento = 'cartao' | 'pix'
type StatusPagamento = 'idle' | 'processing' | 'success' | 'error' | 'pix_pending'

export function PagamentoTransparente({
    pedidoNumero,
    total,
    payer,
    onSuccess,
    onError
}: PagamentoTransparenteProps) {
    const router = useRouter()
    const [metodo, setMetodo] = useState<MetodoPagamento>('cartao')
    const [status, setStatus] = useState<StatusPagamento>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Estados do cartão
    const [cardNumber, setCardNumber] = useState('')
    const [cardholderName, setCardholderName] = useState('')
    const [expirationDate, setExpirationDate] = useState('')
    const [securityCode, setSecurityCode] = useState('')
    const [installments, setInstallments] = useState('1')
    const [issuer, setIssuer] = useState<string | null>(null)
    const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null)
    const [cardBrand, setCardBrand] = useState<string | null>(null)
    const [installmentOptions, setInstallmentOptions] = useState<any[]>([])

    // Configurações de parcelamento da loja
    const [parcelasMaximas, setParcelasMaximas] = useState(12)
    const [taxaJuros, setTaxaJuros] = useState(0)

    // Estados do PIX
    const [pixQrCode, setPixQrCode] = useState<string | null>(null)
    const [pixQrCodeBase64, setPixQrCodeBase64] = useState<string | null>(null)
    const [pixCopied, setPixCopied] = useState(false)

    // Polling para verificar status do PIX
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    // Mercado Pago SDK
    const mpRef = useRef<any>(null)

    // Buscar configurações de parcelamento da loja
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

    // Gerar opções de parcelamento locais (baseado nas configurações da loja)
    useEffect(() => {
        if (parcelasMaximas > 0) {
            const options = []
            for (let i = 1; i <= parcelasMaximas; i++) {
                // Calcular valor com juros: preço * (1 + taxa * parcelas)
                const valorTotalComJuros = taxaJuros > 0 && i > 1
                    ? total * (1 + (taxaJuros / 100) * i)
                    : total
                const valorParcela = valorTotalComJuros / i

                options.push({
                    installments: i,
                    installment_amount: valorParcela,
                    total_amount: valorTotalComJuros,
                    installment_rate: i === 1 ? 0 : taxaJuros
                })
            }
            setInstallmentOptions(options)
        }
    }, [total, parcelasMaximas, taxaJuros])

    useEffect(() => {
        const initMP = () => {
            if (typeof window !== 'undefined' && window.MercadoPago) {
                const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
                mpRef.current = new window.MercadoPago(publicKey, {
                    locale: 'pt-BR'
                })
            }
        }

        if (window.MercadoPago) {
            initMP()
        } else {
            const checkMP = setInterval(() => {
                if (window.MercadoPago) {
                    initMP()
                    clearInterval(checkMP)
                }
            }, 100)
            return () => clearInterval(checkMP)
        }
    }, [])

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current)
            }
        }
    }, [])

    // Detectar bandeira do cartão (não sobrescreve parcelas - usamos as da loja)
    useEffect(() => {
        const detectCardBrand = async () => {
            const cleanNumber = cardNumber.replace(/\D/g, '')
            if (cleanNumber.length >= 6 && mpRef.current) {
                try {
                    const bin = cleanNumber.substring(0, 6)
                    const paymentMethods = await mpRef.current.getPaymentMethods({ bin })

                    if (paymentMethods.results.length > 0) {
                        const pm = paymentMethods.results[0]
                        setPaymentMethodId(pm.id)
                        setCardBrand(pm.name)
                        setIssuer(pm.issuer?.id || null)
                    }
                } catch (error) {
                    console.error('Erro ao detectar bandeira:', error)
                }
            } else {
                setCardBrand(null)
            }
        }

        detectCardBrand()
    }, [cardNumber])

    // Formatar número do cartão
    const formatCardNumber = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        const groups = numbers.match(/.{1,4}/g) || []
        return groups.join(' ').substring(0, 19)
    }

    // Formatar data de validade
    const formatExpirationDate = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        if (numbers.length <= 2) return numbers
        return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`
    }

    // Processar pagamento com cartão
    const handleCardPayment = async () => {
        if (!mpRef.current) {
            toast.error('SDK do Mercado Pago não carregado')
            return
        }

        setStatus('processing')
        setErrorMessage(null)

        try {
            // Validar dados
            const cleanCardNumber = cardNumber.replace(/\D/g, '')
            const [expMonth, expYear] = expirationDate.split('/')

            if (!cleanCardNumber || cleanCardNumber.length < 13) {
                throw new Error('Número do cartão inválido')
            }
            if (!expMonth || !expYear) {
                throw new Error('Data de validade inválida')
            }
            if (!securityCode || securityCode.length < 3) {
                throw new Error('Código de segurança inválido')
            }
            if (!cardholderName) {
                throw new Error('Nome do titular obrigatório')
            }

            // Criar token do cartão
            const cardTokenData = {
                cardNumber: cleanCardNumber,
                cardholderName: cardholderName,
                cardExpirationMonth: expMonth,
                cardExpirationYear: `20${expYear}`,
                securityCode: securityCode,
                identificationType: 'CPF',
                identificationNumber: payer.cpf?.replace(/\D/g, '') || '',
            }

            const tokenResponse = await mpRef.current.createCardToken(cardTokenData)

            if (!tokenResponse.id) {
                throw new Error('Erro ao processar dados do cartão')
            }

            // Calcular valor total com juros para parcelamento
            const numParcelas = parseInt(installments)
            const valorComJuros = taxaJuros > 0 && numParcelas > 1
                ? total * (1 + (taxaJuros / 100) * numParcelas)
                : total

            // Enviar pagamento para API
            const response = await fetch('/api/mercadopago/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pedidoNumero,
                    transaction_amount: valorComJuros,
                    payment_method_id: paymentMethodId,
                    token: tokenResponse.id,
                    installments: numParcelas,
                    issuer_id: issuer,
                    payer: {
                        email: payer.email,
                        identification: {
                            type: 'CPF',
                            number: payer.cpf?.replace(/\D/g, '') || '',
                        },
                    },
                }),
            })

            const result = await response.json()

            if (result.success && result.status === 'approved') {
                setStatus('success')
                toast.success('Pagamento aprovado!')
                setTimeout(() => {
                    onSuccess()
                    router.push(`/pedido/${pedidoNumero}/sucesso`)
                }, 1500)
            } else if (result.status === 'in_process' || result.status === 'pending') {
                setStatus('processing')
                toast.info('Pagamento em análise')
                setTimeout(() => {
                    router.push(`/pedido/${pedidoNumero}/pendente`)
                }, 1500)
            } else {
                throw new Error(result.error || 'Pagamento não aprovado')
            }
        } catch (error: any) {
            console.error('Erro no pagamento:', error)
            setStatus('error')
            setErrorMessage(error.message || 'Erro ao processar pagamento')
            onError(error.message)
        }
    }

    // Gerar PIX
    const handlePixPayment = async () => {
        setStatus('processing')
        setErrorMessage(null)

        try {
            const nameParts = payer.nome.split(' ')
            const firstName = nameParts[0]
            const lastName = nameParts.slice(1).join(' ') || firstName

            const response = await fetch('/api/mercadopago/create-pix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pedidoNumero,
                    transaction_amount: total,
                    payer: {
                        email: payer.email,
                        first_name: firstName,
                        last_name: lastName,
                        identification: {
                            type: 'CPF',
                            number: payer.cpf?.replace(/\D/g, '') || '',
                        },
                    },
                }),
            })

            const result = await response.json()

            if (result.success && result.pix) {
                setPixQrCode(result.pix.qr_code)
                setPixQrCodeBase64(result.pix.qr_code_base64)
                setStatus('pix_pending')

                // Iniciar polling para verificar pagamento
                startPixPolling()

                toast.success('PIX gerado! Escaneie o QR Code ou copie o código')
            } else {
                throw new Error(result.error || 'Erro ao gerar PIX')
            }
        } catch (error: any) {
            console.error('Erro ao gerar PIX:', error)
            setStatus('error')
            setErrorMessage(error.message || 'Erro ao gerar PIX')
            onError(error.message)
        }
    }

    // Polling para verificar status do PIX
    const startPixPolling = () => {
        console.log('[PIX Polling] Iniciando para pedido:', pedidoNumero)

        pollingRef.current = setInterval(async () => {
            try {
                console.log('[PIX Polling] Verificando status...')

                // Primeiro verifica no banco local
                const response = await fetch(`/api/pedidos/${pedidoNumero}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    cache: 'no-store'
                })

                if (response.ok) {
                    const data = await response.json()
                    console.log('[PIX Polling] Status local:', data.pedido?.status)

                    if (data.pedido?.status === 'pago') {
                        if (pollingRef.current) {
                            clearInterval(pollingRef.current)
                        }
                        setStatus('success')
                        toast.success('Pagamento PIX confirmado!')
                        // Marcar flag para evitar redirecionamento indevido para /carrinho
                        sessionStorage.setItem('payment_success_redirect', 'true')
                        setTimeout(() => {
                            onSuccess()
                            router.push(`/pedido/${pedidoNumero}/sucesso`)
                        }, 1500)
                        return
                    }

                    // Se ainda pendente, verifica diretamente no Mercado Pago
                    console.log('[PIX Polling] Verificando no Mercado Pago...')
                    const checkResponse = await fetch('/api/mercadopago/check-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pedidoNumero })
                    })

                    if (checkResponse.ok) {
                        const checkData = await checkResponse.json()
                        console.log('[PIX Polling] Resposta check-payment:', checkData)

                        if (checkData.status === 'pago' || checkData.mpStatus === 'approved') {
                            if (pollingRef.current) {
                                clearInterval(pollingRef.current)
                            }
                            setStatus('success')
                            toast.success('Pagamento PIX confirmado!')
                            // Marcar flag para evitar redirecionamento indevido para /carrinho
                            sessionStorage.setItem('payment_success_redirect', 'true')
                            setTimeout(() => {
                                onSuccess()
                                router.push(`/pedido/${pedidoNumero}/sucesso`)
                            }, 1500)
                        }
                    }
                } else {
                    console.error('[PIX Polling] Erro na resposta:', response.status)
                }
            } catch (error) {
                console.error('[PIX Polling] Erro ao verificar status:', error)
            }
        }, 5000)
    }

    // Copiar código PIX
    const copyPixCode = () => {
        if (pixQrCode) {
            navigator.clipboard.writeText(pixQrCode)
            setPixCopied(true)
            toast.success('Código PIX copiado!')
            setTimeout(() => setPixCopied(false), 3000)
        }
    }

    // Renderizar estado de sucesso
    if (status === 'success') {
        return (
            <Card className="border-green-500 bg-green-50">
                <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full animate-pulse">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-green-700">Pagamento Aprovado!</h3>
                        <p className="text-green-600">Redirecionando...</p>
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-green-600" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Pagamento Seguro
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Seus dados são protegidos com criptografia
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Seleção de método */}
                <RadioGroup
                    value={metodo}
                    onValueChange={(value) => setMetodo(value as MetodoPagamento)}
                    className="grid grid-cols-2 gap-4"
                >
                    <div>
                        <RadioGroupItem value="cartao" id="cartao" className="peer sr-only" />
                        <Label
                            htmlFor="cartao"
                            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                        >
                            <CreditCard className="h-6 w-6" />
                            <span className="font-medium">Cartão</span>
                            <span className="text-xs text-muted-foreground">Crédito ou Débito</span>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="pix" id="pix" className="peer sr-only" />
                        <Label
                            htmlFor="pix"
                            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                        >
                            <QrCode className="h-6 w-6" />
                            <span className="font-medium">PIX</span>
                            <span className="text-xs text-muted-foreground">Aprovação imediata</span>
                        </Label>
                    </div>
                </RadioGroup>

                {/* Formulário do Cartão */}
                {metodo === 'cartao' && status !== 'pix_pending' && (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="cardNumber">Número do Cartão</Label>
                            <div className="relative">
                                <Input
                                    id="cardNumber"
                                    placeholder="0000 0000 0000 0000"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    maxLength={19}
                                    disabled={status === 'processing'}
                                />
                                {cardBrand && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary">
                                        {cardBrand}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="cardholderName">Nome no Cartão</Label>
                            <Input
                                id="cardholderName"
                                placeholder="NOME COMO ESTÁ NO CARTÃO"
                                value={cardholderName}
                                onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                                disabled={status === 'processing'}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="expirationDate">Validade</Label>
                                <Input
                                    id="expirationDate"
                                    placeholder="MM/AA"
                                    value={expirationDate}
                                    onChange={(e) => setExpirationDate(formatExpirationDate(e.target.value))}
                                    maxLength={5}
                                    disabled={status === 'processing'}
                                />
                            </div>
                            <div>
                                <Label htmlFor="securityCode">CVV</Label>
                                <Input
                                    id="securityCode"
                                    placeholder="123"
                                    value={securityCode}
                                    onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    maxLength={4}
                                    disabled={status === 'processing'}
                                />
                            </div>
                        </div>

                        {installmentOptions.length > 0 && (
                            <div>
                                <Label>Parcelas</Label>
                                <Select
                                    value={installments}
                                    onValueChange={setInstallments}
                                    disabled={status === 'processing'}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione as parcelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {installmentOptions.map((option) => (
                                            <SelectItem key={option.installments} value={String(option.installments)}>
                                                {option.installments}x de {formatPrice(option.installment_amount)}
                                                {option.installment_rate === 0 ? ' sem juros' : ` (${formatPrice(option.total_amount)})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Mensagem de erro */}
                        {errorMessage && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <span className="text-sm">{errorMessage}</span>
                            </div>
                        )}

                        <Button
                            className="w-full h-12"
                            onClick={handleCardPayment}
                            disabled={status === 'processing' || !cardNumber || !cardholderName || !expirationDate || !securityCode}
                        >
                            {status === 'processing' ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <Lock className="mr-2 h-5 w-5" />
                                    Pagar {formatPrice(total)}
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* PIX - Botão para gerar */}
                {metodo === 'pix' && (status === 'idle' || status === 'processing') && (
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">
                                Valor a pagar via PIX:
                            </p>
                            <p className="text-3xl font-bold text-primary">{formatPrice(total)}</p>
                        </div>

                        <Button
                            className="w-full h-12"
                            onClick={handlePixPayment}
                            disabled={status === 'processing'}
                        >
                            {status === 'processing' ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Gerando PIX...
                                </>
                            ) : (
                                <>
                                    <QrCode className="mr-2 h-5 w-5" />
                                    Gerar QR Code PIX
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* PIX - QR Code gerado */}
                {status === 'pix_pending' && pixQrCode && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                                Escaneie o QR Code com o app do seu banco
                            </p>

                            {pixQrCodeBase64 && (
                                <div className="inline-block p-4 bg-white rounded-lg border shadow-sm">
                                    <img
                                        src={`data:image/png;base64,${pixQrCodeBase64}`}
                                        alt="QR Code PIX"
                                        className="w-48 h-48 mx-auto"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Ou copie o código PIX:</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={pixQrCode}
                                    readOnly
                                    className="font-mono text-xs"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={copyPixCode}
                                >
                                    {pixCopied ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Aguardando confirmação do pagamento...</span>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                                O pagamento será confirmado automaticamente
                            </p>
                        </div>
                    </div>
                )}

                {/* Selos de segurança */}
                <div className="flex items-center justify-center gap-4 pt-4 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span>Pagamento Seguro</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        <span>Dados Criptografados</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
