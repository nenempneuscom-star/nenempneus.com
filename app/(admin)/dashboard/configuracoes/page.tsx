'use client'

import { useState, useEffect, useCallback } from 'react'
import { ConfigAgendamento } from '@/components/admin/ConfigAgendamento'
import { ConfigPagamento } from '@/components/admin/ConfigPagamento'
import { ConfigWhatsApp } from '@/components/admin/ConfigWhatsApp'
import { Loader2 } from 'lucide-react'

interface Settings {
  horarioInicio: string
  horarioFim: string
  intervaloSlots: number
  clientesPorSlot: number
  formasPagamento: string[]
  descontoPix: number
  botAtivo: boolean
  modoBot: string
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregarSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      if (response.ok) {
        setSettings(data.settings)
      } else {
        setError(data.error || 'Erro ao carregar configuracoes')
      }
    } catch (err) {
      console.error('Erro ao carregar settings:', err)
      setError('Erro ao carregar configuracoes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarSettings()
  }, [carregarSettings])

  const handleSave = async (data: Partial<Settings>) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar')
      }

      // Recarregar settings
      await carregarSettings()
    } catch (err: any) {
      console.error('Erro ao salvar:', err)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Configuracoes</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ConfigAgendamento
          settings={settings}
          onSave={handleSave}
        />
        <ConfigPagamento
          settings={settings}
          onSave={handleSave}
        />
        <ConfigWhatsApp
          settings={settings}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
