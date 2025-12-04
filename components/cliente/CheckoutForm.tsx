'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { checkoutSchema, CheckoutFormData } from '@/lib/validations'
import { criarPedido } from '@/lib/actions'
import { useCarrinhoStore } from '@/lib/store/carrinho-store'
import { Loader2, ArrowRight } from 'lucide-react'
import { CalendarioAgendamento } from './CalendarioAgendamento'
import { RevisaoPedido } from './RevisaoPedido'

declare global {
    interface Window {
        MercadoPago: any
    }
}

// Funções de formatação
const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

const formatarCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
}

const formatarCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
}

const formatarPlaca = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (upper.length <= 3) return upper
    if (upper.length <= 7) {
        const parte1 = upper.slice(0, 3)
        const parte2 = upper.slice(3)
        return `${parte1}-${parte2}`
    }
    return `${upper.slice(0, 3)}-${upper.slice(3, 7)}`
}

type EtapaCheckout = 'formulario' | 'revisao'

export function CheckoutForm() {
    const { items, servicos, getSubtotal, getTotal, limparCarrinho } = useCarrinhoStore()
    const [loading, setLoading] = useState(false)
    const [etapa, setEtapa] = useState<EtapaCheckout>('formulario')
    const [agendamento, setAgendamento] = useState<{ data: string; hora: string } | null>(null)
    const [dadosCliente, setDadosCliente] = useState<CheckoutFormData | null>(null)
    const [deviceId, setDeviceId] = useState<string | null>(null)
    const [buscandoCep, setBuscandoCep] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
    })

    // Função para buscar CEP via ViaCEP
    const buscarCep = async (cep: string) => {
        const cepLimpo = cep.replace(/\D/g, '')
        if (cepLimpo.length !== 8) return

        setBuscandoCep(true)
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
            const data = await response.json()

            if (!data.erro) {
                setValue('endereco', data.logradouro || '')
                setValue('bairro', data.bairro || '')
                setValue('cidade', data.localidade || '')
                setValue('estado', data.uf || '')
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error)
        } finally {
            setBuscandoCep(false)
        }
    }

    // Inicializar MercadoPago SDK para capturar device_id
    useEffect(() => {
        const initMercadoPago = async () => {
            try {
                if (typeof window !== 'undefined' && window.MercadoPago) {
                    const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY, {
                        locale: 'pt-BR'
                    })

                    await mp.getIdentificationTypes()
                    if (mp.deviceId) {
                        setDeviceId(mp.deviceId)
                    }
                }
            } catch (error) {
                console.error('Erro ao inicializar MercadoPago SDK:', error)
            }
        }

        if (typeof window !== 'undefined') {
            if (window.MercadoPago) {
                initMercadoPago()
            } else {
                window.addEventListener('load', initMercadoPago)
                return () => window.removeEventListener('load', initMercadoPago)
            }
        }
    }, [])

    // Avançar para revisão
    const onAvancar = async (data: CheckoutFormData) => {
        // Validar agendamento
        if (!agendamento) {
            alert('Por favor, selecione data e horário para instalação')
            return
        }

        setDadosCliente(data)
        setEtapa('revisao')

        // Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Voltar para formulário
    const onVoltar = () => {
        setEtapa('formulario')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Confirmar e processar pagamento
    const onConfirmar = async () => {
        if (!dadosCliente || !agendamento) return

        setLoading(true)

        try {
            const subtotal = getSubtotal()
            const total = getTotal()

            // 1. Criar pedido
            const resultado = await criarPedido({
                cliente: dadosCliente,
                items,
                subtotal,
                total,
                observacoes: dadosCliente.observacoes,
            })

            if (!resultado.success || !resultado.pedido) {
                alert('Erro ao criar pedido. Tente novamente.')
                return
            }

            // 2. Criar agendamento
            const agendamentoResponse = await fetch('/api/agendamento/criar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pedidoNumero: resultado.pedido.numero,
                    data: agendamento.data,
                    hora: agendamento.hora,
                }),
            })

            const agendamentoData = await agendamentoResponse.json()

            if (!agendamentoData.success) {
                alert('Erro ao criar agendamento. Tente novamente.')
                return
            }

            // 3. Criar preferência Mercado Pago
            const response = await fetch('/api/mercadopago/create-preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pedidoId: resultado.pedido.numero,
                    items,
                    servicos,
                    total,
                    deviceId: deviceId,
                    payer: {
                        name: dadosCliente.nome.split(' ')[0],
                        surname: dadosCliente.nome.split(' ').slice(1).join(' ') || dadosCliente.nome.split(' ')[0],
                        email: dadosCliente.email,
                        phone: {
                            area_code: dadosCliente.telefone.replace(/\D/g, '').slice(0, 2),
                            number: dadosCliente.telefone.replace(/\D/g, '').slice(2),
                        },
                        identification: dadosCliente.cpf ? {
                            type: 'CPF',
                            number: dadosCliente.cpf.replace(/\D/g, ''),
                        } : undefined,
                        address: {
                            zip_code: dadosCliente.cep.replace(/\D/g, ''),
                            street_name: dadosCliente.endereco,
                            street_number: dadosCliente.numero,
                        },
                    },
                }),
            })

            const mpData = await response.json()

            if (mpData.success) {
                limparCarrinho()
                window.location.href = mpData.initPoint
            } else {
                alert('Erro ao criar pagamento. Tente novamente.')
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao processar pedido. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    // Se estiver na etapa de revisão
    if (etapa === 'revisao' && dadosCliente && agendamento) {
        return (
            <RevisaoPedido
                dados={dadosCliente}
                agendamento={agendamento}
                onVoltar={onVoltar}
                onEditarDados={onVoltar}
                onEditarAgendamento={onVoltar}
                onConfirmar={onConfirmar}
                loading={loading}
            />
        )
    }

    // Formulário de checkout
    return (
        <form onSubmit={handleSubmit(onAvancar)} className="space-y-6">
            {/* Indicador de Etapa */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 px-4">
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-medium">
                        1
                    </div>
                    <span className="font-medium text-sm sm:text-base">Dados</span>
                </div>
                <div className="w-6 sm:w-12 h-0.5 bg-muted"></div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs sm:text-sm font-medium">
                        2
                    </div>
                    <span className="text-muted-foreground text-sm sm:text-base">Revisão</span>
                </div>
                <div className="w-6 sm:w-12 h-0.5 bg-muted"></div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs sm:text-sm font-medium">
                        3
                    </div>
                    <span className="text-muted-foreground text-sm sm:text-base">Pagamento</span>
                </div>
            </div>

            {/* Agendamento */}
            <CalendarioAgendamento
                onSelecionarDataHora={(data, hora) => setAgendamento({ data, hora })}
            />

            {/* Dados Pessoais */}
            <Card>
                <CardHeader>
                    <CardTitle>Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="nome">Nome Completo *</Label>
                            <Input id="nome" {...register('nome')} />
                            {errors.nome && (
                                <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="email">E-mail *</Label>
                            <Input id="email" type="email" {...register('email')} />
                            {errors.email && (
                                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                            <Input
                                id="telefone"
                                {...register('telefone')}
                                placeholder="(00) 00000-0000"
                                onChange={(e) => {
                                    e.target.value = formatarTelefone(e.target.value)
                                    register('telefone').onChange(e)
                                }}
                                maxLength={15}
                            />
                            {errors.telefone && (
                                <p className="text-sm text-destructive mt-1">{errors.telefone.message}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="cpf">CPF</Label>
                            <Input
                                id="cpf"
                                {...register('cpf')}
                                placeholder="000.000.000-00"
                                onChange={(e) => {
                                    e.target.value = formatarCPF(e.target.value)
                                    register('cpf').onChange(e)
                                }}
                                maxLength={14}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
                <CardHeader>
                    <CardTitle>Dados de Cadastro</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        A instalação será realizada em nossa loja no dia e horário agendados
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="cep">CEP *</Label>
                            <div className="relative">
                                <Input
                                    id="cep"
                                    {...register('cep')}
                                    placeholder="00000-000"
                                    onChange={(e) => {
                                        const formatted = formatarCEP(e.target.value)
                                        e.target.value = formatted
                                        register('cep').onChange(e)
                                        if (formatted.replace(/\D/g, '').length === 8) {
                                            buscarCep(formatted)
                                        }
                                    }}
                                    maxLength={9}
                                />
                                {buscandoCep && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            {errors.cep && (
                                <p className="text-sm text-destructive mt-1">{errors.cep.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                            <Label htmlFor="endereco">Endereço *</Label>
                            <Input id="endereco" {...register('endereco')} />
                            {errors.endereco && (
                                <p className="text-sm text-destructive mt-1">{errors.endereco.message}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="numero">Número *</Label>
                            <Input id="numero" {...register('numero')} />
                            {errors.numero && (
                                <p className="text-sm text-destructive mt-1">{errors.numero.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="complemento">Complemento</Label>
                            <Input id="complemento" {...register('complemento')} />
                        </div>
                        <div>
                            <Label htmlFor="bairro">Bairro *</Label>
                            <Input id="bairro" {...register('bairro')} />
                            {errors.bairro && (
                                <p className="text-sm text-destructive mt-1">{errors.bairro.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="cidade">Cidade *</Label>
                            <Input id="cidade" {...register('cidade')} />
                            {errors.cidade && (
                                <p className="text-sm text-destructive mt-1">{errors.cidade.message}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="estado">Estado *</Label>
                            <Input id="estado" {...register('estado')} placeholder="SC" maxLength={2} />
                            {errors.estado && (
                                <p className="text-sm text-destructive mt-1">{errors.estado.message}</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dados do Veículo */}
            <Card>
                <CardHeader>
                    <CardTitle>Dados do Veículo (Opcional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="veiculoMarca">Marca</Label>
                            <Input id="veiculoMarca" {...register('veiculoMarca')} placeholder="Ex: Volkswagen" />
                        </div>
                        <div>
                            <Label htmlFor="veiculoModelo">Modelo</Label>
                            <Input id="veiculoModelo" {...register('veiculoModelo')} placeholder="Ex: Gol" />
                        </div>
                        <div>
                            <Label htmlFor="veiculoAno">Ano</Label>
                            <Input id="veiculoAno" {...register('veiculoAno')} placeholder="Ex: 2018" />
                        </div>
                        <div>
                            <Label htmlFor="veiculoPlaca">Placa</Label>
                            <Input
                                id="veiculoPlaca"
                                {...register('veiculoPlaca')}
                                placeholder="ABC-1234 ou ABC-1D23"
                                onChange={(e) => {
                                    e.target.value = formatarPlaca(e.target.value)
                                    register('veiculoPlaca').onChange(e)
                                }}
                                maxLength={8}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Observações */}
            <Card>
                <CardHeader>
                    <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        {...register('observacoes')}
                        placeholder="Alguma observação sobre o pedido?"
                        rows={4}
                    />
                </CardContent>
            </Card>

            {/* Botão Avançar */}
            <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processando...
                    </>
                ) : (
                    <>
                        Revisar Pedido
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
                Na próxima etapa você poderá revisar todos os dados antes de pagar
            </p>
        </form>
    )
}
