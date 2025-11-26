'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock, User, Search, Loader2 } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SeletorHorario } from '@/components/cliente/SeletorHorario'

export function NovoAgendamentoForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [buscandoCliente, setBuscandoCliente] = useState(false)
    const [buscandoPedido, setBuscandoPedido] = useState(false)

    // Dados do formulário
    const [clienteId, setClienteId] = useState('')
    const [pedidoId, setPedidoId] = useState('')
    const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null)
    const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null)
    const [observacoes, setObservacoes] = useState('')
    const [status, setStatus] = useState<'confirmado' | 'em_andamento' | 'concluido' | 'cancelado'>('confirmado')

    // Busca
    const [buscaCliente, setBuscaCliente] = useState('')
    const [buscaPedido, setBuscaPedido] = useState('')
    const [clienteEncontrado, setClienteEncontrado] = useState<any>(null)
    const [pedidoEncontrado, setPedidoEncontrado] = useState<any>(null)

    // Calendário
    const [semanaAtual, setSemanaAtual] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }))
    const [slots, setSlots] = useState<any[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaAtual, i))

    // Carregar slots quando seleciona data
    useEffect(() => {
        if (dataSelecionada) {
            carregarSlots(dataSelecionada)
        }
    }, [dataSelecionada])

    const carregarSlots = async (data: Date) => {
        setLoadingSlots(true)
        try {
            const response = await fetch(
                `/api/agendamento/disponibilidade?data=${format(data, 'yyyy-MM-dd')}`
            )
            const result = await response.json()
            if (result.success) {
                setSlots(result.slots)
            }
        } catch (error) {
            console.error('Erro ao carregar slots:', error)
        } finally {
            setLoadingSlots(false)
        }
    }

    const buscarCliente = async () => {
        if (!buscaCliente.trim()) return

        setBuscandoCliente(true)
        try {
            const response = await fetch(`/api/admin/clientes/buscar?q=${encodeURIComponent(buscaCliente)}`)
            const data = await response.json()

            if (data.success && data.cliente) {
                setClienteEncontrado(data.cliente)
                setClienteId(data.cliente.id)
            } else {
                alert('Cliente não encontrado')
                setClienteEncontrado(null)
                setClienteId('')
            }
        } catch (error) {
            alert('Erro ao buscar cliente')
            console.error(error)
        } finally {
            setBuscandoCliente(false)
        }
    }

    const buscarPedido = async () => {
        if (!buscaPedido.trim()) return

        setBuscandoPedido(true)
        try {
            const response = await fetch(`/api/admin/pedidos/buscar?numero=${encodeURIComponent(buscaPedido)}`)
            const data = await response.json()

            if (data.success && data.pedido) {
                setPedidoEncontrado(data.pedido)
                setPedidoId(data.pedido.id)
                // Auto-preencher cliente se o pedido tiver
                if (data.pedido.cliente) {
                    setClienteEncontrado(data.pedido.cliente)
                    setClienteId(data.pedido.cliente.id)
                }
            } else {
                alert('Pedido não encontrado')
                setPedidoEncontrado(null)
                setPedidoId('')
            }
        } catch (error) {
            alert('Erro ao buscar pedido')
            console.error(error)
        } finally {
            setBuscandoPedido(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!clienteId) {
            alert('Selecione um cliente')
            return
        }

        if (!dataSelecionada || !horarioSelecionado) {
            alert('Selecione data e horário')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/admin/agendamentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clienteId,
                    pedidoId: pedidoId || null,
                    data: format(dataSelecionada, 'yyyy-MM-dd'),
                    hora: horarioSelecionado,
                    observacoes: observacoes || null,
                    status
                })
            })

            const data = await response.json()

            if (data.success) {
                alert('Agendamento criado com sucesso!')
                router.push('/dashboard/agendamentos')
                router.refresh()
            } else {
                alert(data.error || 'Erro ao criar agendamento')
            }
        } catch (error) {
            alert('Erro ao criar agendamento')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Busca de Cliente */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Cliente
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="buscaCliente">Buscar por nome, telefone ou email</Label>
                            <Input
                                id="buscaCliente"
                                value={buscaCliente}
                                onChange={(e) => setBuscaCliente(e.target.value)}
                                placeholder="Digite para buscar..."
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarCliente())}
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={buscarCliente}
                            disabled={buscandoCliente}
                            className="mt-auto"
                        >
                            {buscandoCliente ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {clienteEncontrado && (
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="font-semibold">{clienteEncontrado.nome}</p>
                            {clienteEncontrado.telefone && <p className="text-sm">{clienteEncontrado.telefone}</p>}
                            {clienteEncontrado.email && <p className="text-sm">{clienteEncontrado.email}</p>}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Busca de Pedido (Opcional) */}
            <Card>
                <CardHeader>
                    <CardTitle>Pedido (Opcional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="buscaPedido">Número do pedido</Label>
                            <Input
                                id="buscaPedido"
                                value={buscaPedido}
                                onChange={(e) => setBuscaPedido(e.target.value)}
                                placeholder="Ex: 00001"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarPedido())}
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={buscarPedido}
                            disabled={buscandoPedido}
                            className="mt-auto"
                        >
                            {buscandoPedido ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {pedidoEncontrado && (
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="font-semibold">Pedido #{pedidoEncontrado.numero}</p>
                            <p className="text-sm">Total: R$ {(pedidoEncontrado.total / 100).toFixed(2)}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Data e Horário */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Data e Horário
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Navegação Semana */}
                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSemanaAtual(addWeeks(semanaAtual, -1))}
                        >
                            Semana Anterior
                        </Button>
                        <span className="font-medium">
                            {format(semanaAtual, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSemanaAtual(addWeeks(semanaAtual, 1))}
                        >
                            Próxima Semana
                        </Button>
                    </div>

                    {/* Dias da Semana */}
                    <div className="grid grid-cols-7 gap-2">
                        {diasSemana.map((dia) => {
                            const isHoje = isSameDay(dia, new Date())
                            const isSelecionado = dataSelecionada && isSameDay(dia, dataSelecionada)
                            const isPassado = dia < new Date() && !isHoje

                            return (
                                <Button
                                    key={dia.toString()}
                                    type="button"
                                    variant={isSelecionado ? 'default' : 'outline'}
                                    disabled={isPassado}
                                    onClick={() => {
                                        setDataSelecionada(dia)
                                        setHorarioSelecionado(null)
                                    }}
                                    className="flex flex-col h-auto py-3"
                                >
                                    <span className="text-xs text-muted-foreground">
                                        {format(dia, 'EEE', { locale: ptBR })}
                                    </span>
                                    <span className="text-lg font-bold">
                                        {format(dia, 'dd')}
                                    </span>
                                </Button>
                            )
                        })}
                    </div>

                    {/* Horários */}
                    {dataSelecionada && (
                        <div className="border-t pt-6">
                            {loadingSlots ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Carregando horários...
                                </p>
                            ) : (
                                <SeletorHorario
                                    slots={slots}
                                    horarioSelecionado={horarioSelecionado}
                                    onSelecionarHorario={setHorarioSelecionado}
                                />
                            )}
                        </div>
                    )}

                    {/* Resumo Seleção */}
                    {dataSelecionada && horarioSelecionado && (
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Agendamento selecionado:</p>
                            <p className="font-semibold">
                                {format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })} às {horarioSelecionado}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="confirmado">Confirmado</SelectItem>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Observações */}
            <Card>
                <CardHeader>
                    <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Observações sobre o agendamento..."
                        rows={4}
                    />
                </CardContent>
            </Card>

            {/* Botões */}
            <div className="flex gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                        </>
                    ) : (
                        'Criar Agendamento'
                    )}
                </Button>
            </div>
        </form>
    )
}
