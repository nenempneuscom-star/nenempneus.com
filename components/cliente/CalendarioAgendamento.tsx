'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SeletorHorario } from './SeletorHorario'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CalendarioAgendamentoProps {
    onSelecionarDataHora: (data: string, hora: string) => void
}

export function CalendarioAgendamento({ onSelecionarDataHora }: CalendarioAgendamentoProps) {
    const [semanaAtual, setSemanaAtual] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }))
    const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null)
    const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null)
    const [slots, setSlots] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Gerar dias da semana
    const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaAtual, i))

    // Carregar slots quando seleciona data
    useEffect(() => {
        if (dataSelecionada) {
            carregarSlots(dataSelecionada)
        }
    }, [dataSelecionada])

    const carregarSlots = async (data: Date) => {
        setLoading(true)
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
            setLoading(false)
        }
    }

    const handleSelecionarData = (data: Date) => {
        setDataSelecionada(data)
        setHorarioSelecionado(null)
    }

    const handleSelecionarHorario = (hora: string) => {
        setHorarioSelecionado(hora)
        if (dataSelecionada) {
            onSelecionarDataHora(format(dataSelecionada, 'yyyy-MM-dd'), hora)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Agendar Instalação
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Navegação Semana */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSemanaAtual(addWeeks(semanaAtual, -1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium">
                        {format(semanaAtual, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSemanaAtual(addWeeks(semanaAtual, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
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
                                variant={isSelecionado ? 'default' : 'outline'}
                                disabled={isPassado}
                                onClick={() => handleSelecionarData(dia)}
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
                        {loading ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Carregando horários...
                            </p>
                        ) : (
                            <SeletorHorario
                                slots={slots}
                                horarioSelecionado={horarioSelecionado}
                                onSelecionarHorario={handleSelecionarHorario}
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
    )
}
