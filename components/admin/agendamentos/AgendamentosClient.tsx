'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    Car,
    MapPin,
    MoreVertical,
    CheckCircle2,
    XCircle,
    PlayCircle,
    AlertCircle,
    Eye,
    Edit,
    Ban
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// Função para extrair hora de forma consistente (ignora problemas de timezone)
function formatarHora(hora: any): string {
    if (!hora) return '--:--'

    // Se for string, extrair HH:mm diretamente
    if (typeof hora === 'string') {
        // Formato ISO: "1970-01-01T08:00:00.000Z" ou "08:00:00" ou "08:00"
        const match = hora.match(/(\d{2}):(\d{2})/)
        if (match) {
            return `${match[1]}:${match[2]}`
        }
    }

    // Se tiver toISOString (Date ou objeto com essa propriedade)
    if (hora && typeof hora.toISOString === 'function') {
        // Extrair do ISO string para evitar conversão de timezone
        const iso = hora.toISOString()
        const match = iso.match(/T(\d{2}):(\d{2})/)
        if (match) {
            return `${match[1]}:${match[2]}`
        }
    }

    // Último recurso: tentar converter e formatar
    try {
        const d = new Date(hora)
        // Usar getUTCHours/getUTCMinutes para ignorar timezone local
        const h = String(d.getUTCHours()).padStart(2, '0')
        const m = String(d.getUTCMinutes()).padStart(2, '0')
        return `${h}:${m}`
    } catch {
        return '--:--'
    }
}

interface AgendamentosClientProps {
    initialAgendamentos: any[]
}

export function AgendamentosClient({ initialAgendamentos }: AgendamentosClientProps) {
    const router = useRouter()
    const [agendamentos, setAgendamentos] = useState(initialAgendamentos)
    const [detalhesAberto, setDetalhesAberto] = useState(false)
    const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any>(null)
    const [cancelando, setCancelando] = useState<string | null>(null)

    const handleCancelarAgendamento = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return

        setCancelando(id)
        try {
            const res = await fetch(`/api/admin/agendamentos/${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                // Atualizar lista localmente
                setAgendamentos(agendamentos.map(ag =>
                    ag.id === id ? { ...ag, status: 'cancelado' } : ag
                ))
                router.refresh()
            } else {
                const data = await res.json()
                alert(data.error || 'Erro ao cancelar agendamento')
            }
        } catch (error) {
            alert('Erro ao cancelar agendamento')
        } finally {
            setCancelando(null)
        }
    }

    // Agrupar por data (extraindo data diretamente da string ISO para evitar problemas de timezone)
    const groupedAgendamentos: Record<string, any[]> = agendamentos.reduce((acc: Record<string, any[]>, ag) => {
        // Extrair apenas a parte da data (yyyy-MM-dd) da string ISO
        let dateKey: string
        if (typeof ag.data === 'string') {
            // Pode ser "2024-11-30" ou "2024-11-30T00:00:00.000Z"
            dateKey = ag.data.substring(0, 10)
        } else {
            // Se for Date object, usar toISOString para evitar problemas de timezone
            dateKey = new Date(ag.data).toISOString().substring(0, 10)
        }
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(ag)
        return acc
    }, {})

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'confirmado':
                return { color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', icon: CheckCircle2, label: 'Confirmado' }
            case 'em_andamento':
                return { color: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', icon: PlayCircle, label: 'Em Andamento' }
            case 'concluido':
                return { color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2, label: 'Concluído' }
            case 'cancelado':
                return { color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, label: 'Cancelado' }
            default:
                return { color: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700', icon: AlertCircle, label: status }
        }
    }

    return (
        <div className="space-y-8">
            {Object.entries(groupedAgendamentos).length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-10 text-center">
                        <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <p className="text-lg font-medium text-muted-foreground">Nenhum agendamento para os próximos dias.</p>
                    </CardContent>
                </Card>
            ) : (
                Object.keys(groupedAgendamentos).sort().map((date) => {
                    const items = groupedAgendamentos[date]
                    return (
                    <div key={date} className="relative">
                        {/* Date Header */}
                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-4 mb-4 border-b flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold capitalize">
                                    {format(new Date(date + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {items.length} agendamento{items.length !== 1 && 's'}
                                </p>
                            </div>
                        </div>

                        {/* Timeline Items */}
                        <div className="space-y-4 pl-4 sm:pl-0">
                            {items.map((ag) => {
                                const status = getStatusConfig(ag.status)
                                const StatusIcon = status.icon

                                return (
                                    <div key={ag.id} className="group relative flex gap-4 sm:gap-6">
                                        {/* Time Column */}
                                        <div className="flex flex-col items-center pt-1">
                                            <span className="text-sm font-bold text-muted-foreground">
                                                {formatarHora(ag.hora)}
                                            </span>
                                            <div className="h-full w-px bg-border mt-2 group-last:hidden" />
                                        </div>

                                        {/* Card */}
                                        <Card className="flex-1 hover:shadow-md transition-all duration-200 border-l-4" style={{ borderLeftColor: status.color.replace('bg-', 'var(--') }}>
                                            <CardContent className="p-4 sm:p-5">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                    <div className="space-y-3">
                                                        {/* Header: Name & Status */}
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <h4 className="font-bold text-lg text-foreground">
                                                                {ag.cliente.nome}
                                                            </h4>
                                                            <Badge variant="secondary" className={cn("font-medium", status.bg, status.text)}>
                                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                                {status.label}
                                                            </Badge>
                                                        </div>

                                                        {/* Details Grid */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                                            {ag.cliente.veiculoMarca && (
                                                                <div className="flex items-center gap-2">
                                                                    <Car className="h-4 w-4 text-primary/70" />
                                                                    <span className="text-foreground">
                                                                        {ag.cliente.veiculoMarca} {ag.cliente.veiculoModelo}
                                                                        {ag.cliente.veiculoPlaca && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-2 font-mono">{ag.cliente.veiculoPlaca}</span>}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {ag.cliente.telefone && (
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4 text-primary/70" />
                                                                    <span className="text-foreground">{ag.cliente.telefone}</span>
                                                                </div>
                                                            )}
                                                            {ag.pedido && (
                                                                <div className="flex items-center gap-2 col-span-full mt-1 pt-2 border-t border-dashed">
                                                                    <span className="font-medium text-foreground">Serviço:</span>
                                                                    <span className="text-foreground">Pedido #{ag.pedido.numero}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 self-end sm:self-start">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => {
                                                                    setAgendamentoSelecionado(ag)
                                                                    setDetalhesAberto(true)
                                                                }}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    Ver Detalhes
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => {
                                                                    router.push(`/dashboard/agendamentos/${ag.id}/editar`)
                                                                }}>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() => handleCancelarAgendamento(ag.id)}
                                                                    disabled={cancelando === ag.id || ag.status === 'cancelado'}
                                                                >
                                                                    <Ban className="h-4 w-4 mr-2" />
                                                                    {cancelando === ag.id ? 'Cancelando...' : 'Cancelar'}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )})
            )}

            {/* Dialog de Detalhes */}
            <Dialog open={detalhesAberto} onOpenChange={setDetalhesAberto}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Agendamento</DialogTitle>
                        <DialogDescription>
                            Informações completas sobre o agendamento
                        </DialogDescription>
                    </DialogHeader>
                    {agendamentoSelecionado && (
                        <div className="space-y-6">
                            {/* Cliente */}
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-3">Cliente</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-primary/70" />
                                        <span className="font-medium">{agendamentoSelecionado.cliente.nome}</span>
                                    </div>
                                    {agendamentoSelecionado.cliente.telefone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">Telefone:</span>
                                            <span>{agendamentoSelecionado.cliente.telefone}</span>
                                        </div>
                                    )}
                                    {agendamentoSelecionado.cliente.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">Email:</span>
                                            <span>{agendamentoSelecionado.cliente.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Veículo */}
                            {agendamentoSelecionado.cliente.veiculoMarca && (
                                <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">Veículo</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Car className="h-4 w-4 text-primary/70" />
                                            <span>{agendamentoSelecionado.cliente.veiculoMarca} {agendamentoSelecionado.cliente.veiculoModelo}</span>
                                        </div>
                                        {agendamentoSelecionado.cliente.veiculoPlaca && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Placa:</span>
                                                <span className="font-mono bg-primary/10 text-primary px-2 py-1 rounded">{agendamentoSelecionado.cliente.veiculoPlaca}</span>
                                            </div>
                                        )}
                                        {agendamentoSelecionado.cliente.veiculoAno && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Ano:</span>
                                                <span>{agendamentoSelecionado.cliente.veiculoAno}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Data e Hora */}
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-3">Agendamento</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-primary/70" />
                                        <span>{format(new Date(agendamentoSelecionado.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary/70" />
                                        <span>{formatarHora(agendamentoSelecionado.hora)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pedido */}
                            {agendamentoSelecionado.pedido && (
                                <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">Pedido</h4>
                                    <div className="space-y-2">
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Número:</span>
                                            <span className="ml-2 font-medium">#{agendamentoSelecionado.pedido.numero}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Observações */}
                            {agendamentoSelecionado.observacoes && (
                                <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">Observações</h4>
                                    <p className="text-sm text-foreground bg-muted p-3 rounded-lg">
                                        {agendamentoSelecionado.observacoes}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
