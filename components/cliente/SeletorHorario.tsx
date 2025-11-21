'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { SlotHorario } from '@/lib/agendamento'

interface SeletorHorarioProps {
    slots: SlotHorario[]
    horarioSelecionado: string | null
    onSelecionarHorario: (hora: string) => void
}

export function SeletorHorario({
    slots,
    horarioSelecionado,
    onSelecionarHorario,
}: SeletorHorarioProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Selecione o horário</h3>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {slots.map((slot) => (
                    <Button
                        key={slot.hora}
                        variant={horarioSelecionado === slot.hora ? 'default' : 'outline'}
                        disabled={!slot.disponivel}
                        onClick={() => onSelecionarHorario(slot.hora)}
                        className="relative"
                    >
                        {slot.hora}
                        {slot.disponivel && slot.vagas <= 2 && (
                            <Badge
                                variant="secondary"
                                className="absolute -top-2 -right-2 text-xs px-1"
                            >
                                {slot.vagas}
                            </Badge>
                        )}
                    </Button>
                ))}
            </div>

            {slots.filter((s) => s.disponivel).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum horário disponível para esta data
                </p>
            )}
        </div>
    )
}
