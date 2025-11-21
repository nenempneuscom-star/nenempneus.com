'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar, Loader2, Check } from 'lucide-react'

interface ConfigAgendamentoProps {
  settings: {
    horarioInicio: string
    horarioFim: string
    intervaloSlots: number
    clientesPorSlot: number
  } | null
  onSave: (data: any) => Promise<void>
}

export function ConfigAgendamento({ settings, onSave }: ConfigAgendamentoProps) {
  const [horarioInicio, setHorarioInicio] = useState('08:00')
  const [horarioFim, setHorarioFim] = useState('18:00')
  const [intervaloSlots, setIntervaloSlots] = useState(60)
  const [clientesPorSlot, setClientesPorSlot] = useState(2)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setHorarioInicio(settings.horarioInicio || '08:00')
      setHorarioFim(settings.horarioFim || '18:00')
      setIntervaloSlots(settings.intervaloSlots || 60)
      setClientesPorSlot(settings.clientesPorSlot || 2)
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await onSave({
        horarioInicio,
        horarioFim,
        intervaloSlots,
        clientesPorSlot,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agendamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Horario Inicio</Label>
            <Input
              type="time"
              value={horarioInicio}
              onChange={(e) => setHorarioInicio(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Horario Fim</Label>
            <Input
              type="time"
              value={horarioFim}
              onChange={(e) => setHorarioFim(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Intervalo (minutos)</Label>
            <Input
              type="number"
              value={intervaloSlots}
              onChange={(e) => setIntervaloSlots(parseInt(e.target.value) || 60)}
              min="15"
              step="15"
            />
          </div>
          <div className="space-y-2">
            <Label>Clientes por Slot</Label>
            <Input
              type="number"
              value={clientesPorSlot}
              onChange={(e) => setClientesPorSlot(parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : saved ? (
            <Check className="h-4 w-4 mr-2" />
          ) : null}
          {saved ? 'Salvo!' : 'Salvar Configuracoes'}
        </Button>
      </CardContent>
    </Card>
  )
}
