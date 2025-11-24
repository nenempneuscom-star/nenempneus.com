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
    AlertCircle
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
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface AgendamentosClientProps {
    initialAgendamentos: any[]
}

export function AgendamentosClient({ initialAgendamentos }: AgendamentosClientProps) {
    const [agendamentos] = useState(initialAgendamentos)

    // Agrupar por data
    const groupedAgendamentos: Record<string, any[]> = agendamentos.reduce((acc: Record<string, any[]>, ag) => {
        const dateKey = format(new Date(ag.data), 'yyyy-MM-dd')
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
                Object.entries(groupedAgendamentos).sort().map(([date, items]) => (
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
                                            <span className="text-sm font-bold text-muted-foreground">{ag.hora}</span>
                                            <div className="h-full w-px bg-border mt-2 group-last:hidden" />
                                        </div>

                                        {/* Card */}
                                        <Card className="flex-1 hover:shadow-md transition-all duration-200 border-l-4" style={{ borderLeftColor: status.color.replace('bg-', 'var(--') }}>
                                            <CardContent className="p-4 sm:p-5">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                    <div className="space-y-3">
                                                        {/* Header: Name & Status */}
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                                                {ag.cliente.nome}
                                                            </h4>
                                                            <Badge variant="secondary" className={cn("font-medium", status.bg, status.text)}>
                                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                                {status.label}
                                                            </Badge>
                                                        </div>

                                                        {/* Details Grid */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                                                            {ag.cliente.veiculoMarca && (
                                                                <div className="flex items-center gap-2">
                                                                    <Car className="h-4 w-4 text-gray-400" />
                                                                    <span>
                                                                        {ag.cliente.veiculoMarca} {ag.cliente.veiculoModelo}
                                                                        {ag.cliente.veiculoPlaca && <span className="text-xs bg-muted px-1.5 py-0.5 rounded ml-2 font-mono">{ag.cliente.veiculoPlaca}</span>}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {ag.cliente.telefone && (
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4 text-gray-400" />
                                                                    <span>{ag.cliente.telefone}</span>
                                                                </div>
                                                            )}
                                                            {ag.pedido && (
                                                                <div className="flex items-center gap-2 col-span-full mt-1 pt-2 border-t border-dashed">
                                                                    <span className="font-medium text-gray-700 dark:text-gray-300">Serviço:</span>
                                                                    <span>Pedido #{ag.pedido.numero}</span>
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
                                                                <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                                                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600">Cancelar</DropdownMenuItem>
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
                ))
            )}
        </div>
    )
}
