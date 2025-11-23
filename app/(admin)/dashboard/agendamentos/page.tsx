'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  Clock,
  User,
  Car,
  Phone,
  Package,
  CheckCircle,
  XCircle,
  PlayCircle,
  Loader2,
  Filter,
  RefreshCw,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Cliente {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  veiculoMarca: string | null
  veiculoModelo: string | null
  veiculoPlaca: string | null
}

interface PedidoItem {
  produto: {
    nome: string
    specs: any
  }
  quantidade: number
}

interface Pedido {
  id: string
  numero: string
  total: number
  status: string
  items: PedidoItem[]
}

interface Agendamento {
  id: string
  data: string
  hora: string
  status: string
  observacoes: string | null
  lembreteEnviado: boolean
  createdAt: string
  cliente: Cliente
  pedido: Pedido | null
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  confirmado: {
    label: 'Confirmado',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle
  },
  em_andamento: {
    label: 'Em Andamento',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: PlayCircle
  },
  concluido: {
    label: 'Concluido',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle
  },
  cancelado: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle
  },
}

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroData, setFiltroData] = useState('')
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null)
  const [atualizando, setAtualizando] = useState<string | null>(null)

  const carregarAgendamentos = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filtroStatus !== 'todos') {
        params.append('status', filtroStatus)
      }
      if (filtroData) {
        params.append('dataInicio', filtroData)
        params.append('dataFim', filtroData)
      }

      const response = await fetch(`/api/admin/agendamentos?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAgendamentos(data.agendamentos)
        setError(null)
      } else {
        setError(data.error || 'Erro ao carregar agendamentos')
      }
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err)
      setError('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }, [filtroStatus, filtroData])

  useEffect(() => {
    carregarAgendamentos()
  }, [carregarAgendamentos])

  const atualizarStatus = async (id: string, novoStatus: string) => {
    try {
      setAtualizando(id)
      const response = await fetch(`/api/admin/agendamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      })

      if (response.ok) {
        await carregarAgendamentos()
        if (agendamentoSelecionado?.id === id) {
          setAgendamentoSelecionado(prev => prev ? { ...prev, status: novoStatus } : null)
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    } finally {
      setAtualizando(null)
    }
  }

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr + 'T00:00:00')
    return data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatarDataCurta = (dataStr: string) => {
    const data = new Date(dataStr + 'T00:00:00')
    return data.toLocaleDateString('pt-BR')
  }

  // Agrupar agendamentos por data
  const agendamentosPorData = agendamentos.reduce((acc, ag) => {
    const data = ag.data
    if (!acc[data]) {
      acc[data] = []
    }
    acc[data].push(ag)
    return acc
  }, {} as Record<string, Agendamento[]>)

  // Contadores por status
  const contadores = {
    total: agendamentos.length,
    confirmado: agendamentos.filter(a => a.status === 'confirmado').length,
    em_andamento: agendamentos.filter(a => a.status === 'em_andamento').length,
    concluido: agendamentos.filter(a => a.status === 'concluido').length,
    cancelado: agendamentos.filter(a => a.status === 'cancelado').length,
  }

  if (loading && agendamentos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Agendamentos</h2>
        <Button onClick={carregarAgendamentos} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de Status */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroStatus('todos')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contadores.total}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroStatus('confirmado')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{contadores.confirmado}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroStatus('em_andamento')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <PlayCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{contadores.em_andamento}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroStatus('concluido')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{contadores.concluido}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroStatus('cancelado')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{contadores.cancelado}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="w-[180px]"
            />
            {(filtroStatus !== 'todos' || filtroData) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFiltroStatus('todos')
                  setFiltroData('')
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Lista de Agendamentos */}
      {agendamentos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(agendamentosPorData).map(([data, ags]) => (
            <div key={data}>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {formatarData(data)}
              </h3>
              <div className="grid gap-3">
                {ags.map((ag) => {
                  const statusInfo = statusConfig[ag.status] || statusConfig.confirmado
                  const StatusIcon = statusInfo.icon

                  return (
                    <Card key={ag.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Info Principal */}
                          <div className="flex items-start gap-4 flex-1">
                            <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-3 min-w-[70px]">
                              <Clock className="h-4 w-4 text-primary mb-1" />
                              <span className="text-lg font-bold text-primary">{ag.hora}</span>
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{ag.cliente.nome}</span>
                                <Badge variant="outline" className={statusInfo.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </div>

                              {ag.cliente.telefone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {ag.cliente.telefone}
                                </div>
                              )}

                              {(ag.cliente.veiculoMarca || ag.cliente.veiculoModelo) && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Car className="h-3 w-3" />
                                  {[ag.cliente.veiculoMarca, ag.cliente.veiculoModelo, ag.cliente.veiculoPlaca]
                                    .filter(Boolean)
                                    .join(' - ')}
                                </div>
                              )}

                              {ag.pedido && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Package className="h-3 w-3" />
                                  Pedido #{ag.pedido.numero} - R$ {ag.pedido.total.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Acoes */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAgendamentoSelecionado(ag)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detalhes
                            </Button>

                            {ag.status === 'confirmado' && (
                              <Button
                                size="sm"
                                onClick={() => atualizarStatus(ag.id, 'em_andamento')}
                                disabled={atualizando === ag.id}
                              >
                                {atualizando === ag.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <PlayCircle className="h-4 w-4 mr-1" />
                                    Iniciar
                                  </>
                                )}
                              </Button>
                            )}

                            {ag.status === 'em_andamento' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => atualizarStatus(ag.id, 'concluido')}
                                disabled={atualizando === ag.id}
                              >
                                {atualizando === ag.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Concluir
                                  </>
                                )}
                              </Button>
                            )}

                            {(ag.status === 'confirmado' || ag.status === 'em_andamento') && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => atualizarStatus(ag.id, 'cancelado')}
                                disabled={atualizando === ag.id}
                              >
                                {atualizando === ag.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancelar
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={!!agendamentoSelecionado} onOpenChange={() => setAgendamentoSelecionado(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              {agendamentoSelecionado && formatarData(agendamentoSelecionado.data)} as {agendamentoSelecionado?.hora}
            </DialogDescription>
          </DialogHeader>

          {agendamentoSelecionado && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant="outline" className={statusConfig[agendamentoSelecionado.status]?.color}>
                  {statusConfig[agendamentoSelecionado.status]?.label}
                </Badge>
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                  <p><strong>Nome:</strong> {agendamentoSelecionado.cliente.nome}</p>
                  {agendamentoSelecionado.cliente.telefone && (
                    <p><strong>Telefone:</strong> {agendamentoSelecionado.cliente.telefone}</p>
                  )}
                  {agendamentoSelecionado.cliente.email && (
                    <p><strong>Email:</strong> {agendamentoSelecionado.cliente.email}</p>
                  )}
                  {agendamentoSelecionado.cliente.veiculoMarca && (
                    <p>
                      <strong>Veiculo:</strong> {agendamentoSelecionado.cliente.veiculoMarca} {agendamentoSelecionado.cliente.veiculoModelo}
                      {agendamentoSelecionado.cliente.veiculoPlaca && ` - ${agendamentoSelecionado.cliente.veiculoPlaca}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Pedido */}
              {agendamentoSelecionado.pedido && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Pedido #{agendamentoSelecionado.pedido.numero}
                  </h4>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="space-y-1">
                      {agendamentoSelecionado.pedido.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.quantidade}x {item.produto.nome}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>R$ {agendamentoSelecionado.pedido.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Observacoes */}
              {agendamentoSelecionado.observacoes && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Observacoes</h4>
                  <p className="text-muted-foreground bg-muted/50 p-4 rounded-lg">
                    {agendamentoSelecionado.observacoes}
                  </p>
                </div>
              )}

              {/* Acoes no Modal */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {agendamentoSelecionado.status === 'confirmado' && (
                  <>
                    <Button
                      onClick={() => atualizarStatus(agendamentoSelecionado.id, 'em_andamento')}
                      disabled={atualizando === agendamentoSelecionado.id}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Iniciar Atendimento
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => atualizarStatus(agendamentoSelecionado.id, 'cancelado')}
                      disabled={atualizando === agendamentoSelecionado.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                )}
                {agendamentoSelecionado.status === 'em_andamento' && (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => atualizarStatus(agendamentoSelecionado.id, 'concluido')}
                      disabled={atualizando === agendamentoSelecionado.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Concluido
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => atualizarStatus(agendamentoSelecionado.id, 'cancelado')}
                      disabled={atualizando === agendamentoSelecionado.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
