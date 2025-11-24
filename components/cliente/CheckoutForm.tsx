'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Loader2 } from 'lucide-react'
import { CalendarioAgendamento } from './CalendarioAgendamento'

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
    // Placa Mercosul: ABC1D23 (7 caracteres)
    // Placa antiga: ABC1234 (7 caracteres)
    if (upper.length <= 3) return upper
    if (upper.length <= 7) {
        // Detecta se é Mercosul (letra na 5ª posição) ou antiga
        const parte1 = upper.slice(0, 3)
        const parte2 = upper.slice(3)
        // Mercosul: ABC1D23 -> ABC-1D23
        // Antiga: ABC1234 -> ABC-1234
        return `${parte1}-${parte2}`
    }
    return `${upper.slice(0, 3)}-${upper.slice(3, 7)}`
}

export function CheckoutForm() {
    const router = useRouter()
    const { items, getSubtotal, limparCarrinho } = useCarrinhoStore()
    const [loading, setLoading] = useState(false)
    const [agendamento, setAgendamento] = useState<{ data: string; hora: string } | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
    })

    const onSubmit = async (data: CheckoutFormData) => {
        setLoading(true)

        try {
            // Validar agendamento selecionado
            if (!agendamento) {
                alert('Por favor, selecione data e horário para instalação')
                setLoading(false)
                return
            }

            const subtotal = getSubtotal()

            // 1. Criar pedido
            const resultado = await criarPedido({
                cliente: data,
                items,
                subtotal,
                total: subtotal,
                observacoes: data.observacoes,
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
                    total: subtotal,
                }),
            })

            const mpData = await response.json()

            if (mpData.success) {
                // 3. Limpar carrinho e redirecionar para Mercado Pago
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

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    <CardTitle>Endereço de Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="cep">CEP *</Label>
                            <Input
                                id="cep"
                                {...register('cep')}
                                placeholder="00000-000"
                                onChange={(e) => {
                                    e.target.value = formatarCEP(e.target.value)
                                    register('cep').onChange(e)
                                }}
                                maxLength={9}
                            />
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

            {/* Botão Finalizar */}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processando...
                    </>
                ) : (
                    'Finalizar Pedido'
                )}
            </Button>
        </form>
    )
}
