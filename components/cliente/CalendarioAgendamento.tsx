'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SeletorHorario } from './SeletorHorario'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, isSameDay, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CalendarioAgendamentoProps {
    onSelecionarDataHora: (data: string, hora: string) => void
    dataInicial?: string // formato yyyy-MM-dd
    horaInicial?: string // formato HH:mm
}

export function CalendarioAgendamento({ onSelecionarDataHora, dataInicial, horaInicial }: CalendarioAgendamentoProps) {
    // Iniciar na semana que contém o dia de hoje ou a data inicial
    const hoje = new Date()
    const dataInicialObj = dataInicial ? new Date(dataInicial + 'T12:00:00') : null
    const inicioSemanaHoje = startOfWeek(dataInicialObj || hoje, { weekStartsOn: 0 })
    const [semanaAtual, setSemanaAtual] = useState(inicioSemanaHoje)
    const [dataSelecionada, setDataSelecionada] = useState<Date | null>(dataInicialObj)
    const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(horaInicial || null)
    const [slots, setSlots] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [diasFuncionamento, setDiasFuncionamento] = useState<number[]>([1, 2, 3, 4, 5, 6])
    const horariosSectionRef = useRef<HTMLDivElement>(null)

    // Carregar configuração de dias de funcionamento
    useEffect(() => {
        async function carregarConfig() {
            try {
                const response = await fetch('/api/agendamento/config')
                const result = await response.json()
                if (result.success) {
                    setDiasFuncionamento(result.config.diasFuncionamento)
                }
            } catch (error) {
                console.error('Erro ao carregar configuração:', error)
            }
        }
        carregarConfig()
    }, [])

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
                // Scroll suave para os horários após carregar
                setTimeout(() => {
                    horariosSectionRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
                    })
                }, 100)
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
        <Card id="calendario-agendamento">
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
                        disabled={isBefore(addWeeks(semanaAtual, -1), startOfWeek(new Date(), { weekStartsOn: 0 }))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium capitalize">
                        {/* Mostrar o mês baseado no meio da semana para evitar mostrar mês errado */}
                        {format(addDays(semanaAtual, 3), 'MMMM yyyy', { locale: ptBR })}
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
                        const agora = new Date()
                        const isHoje = isSameDay(dia, agora)
                        const isSelecionado = dataSelecionada && isSameDay(dia, dataSelecionada)
                        // Dia passado = antes de hoje (comparando apenas datas, não horas)
                        const isPassado = isBefore(startOfDay(dia), startOfDay(agora))
                        // Verificar se é dia de funcionamento
                        const diaSemana = dia.getDay() // 0 = domingo, 1 = segunda, etc
                        const isFechado = !diasFuncionamento.includes(diaSemana)

                        return (
                            <Button
                                key={dia.toString()}
                                variant={isSelecionado ? 'default' : 'outline'}
                                disabled={isPassado || isFechado}
                                onClick={() => handleSelecionarData(dia)}
                                className={`flex flex-col h-auto py-3 ${isFechado ? 'opacity-40' : ''}`}
                            >
                                <span className="text-xs text-muted-foreground">
                                    {format(dia, 'EEE', { locale: ptBR })}
                                </span>
                                <span className="text-lg font-bold">
                                    {format(dia, 'dd')}
                                </span>
                                {isFechado && (
                                    <span className="text-[10px] text-destructive">Fechado</span>
                                )}
                            </Button>
                        )
                    })}
                </div>

                {/* Horários */}
                {dataSelecionada && (
                    <div ref={horariosSectionRef} className="border-t pt-6">
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
