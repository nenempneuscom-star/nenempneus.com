'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MessageSquare, Loader2, Check } from 'lucide-react'

interface ConfigWhatsAppProps {
  settings: {
    botAtivo: boolean
    modoBot: string
  } | null
  onSave: (data: any) => Promise<void>
}

export function ConfigWhatsApp({ settings, onSave }: ConfigWhatsAppProps) {
  const [botAtivo, setBotAtivo] = useState(true)
  const [modoBot, setModoBot] = useState<'comercial' | 'economico'>('comercial')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setBotAtivo(settings.botAtivo ?? true)
      setModoBot((settings.modoBot as 'comercial' | 'economico') || 'comercial')
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await onSave({
        botAtivo,
        modoBot,
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
          <MessageSquare className="h-5 w-5" />
          WhatsApp Bot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-0.5">
            <Label>Bot Ativo</Label>
            <p className="text-sm text-muted-foreground">
              Respostas automaticas com IA
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={botAtivo}
              onChange={(e) => setBotAtivo(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {botAtivo && (
          <div className="space-y-3 pt-2">
            <Label>Modo de Operacao</Label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setModoBot('comercial')}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  modoBot === 'comercial'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium">Comercial</div>
                <p className="text-sm text-muted-foreground">
                  Respostas completas e detalhadas (mais tokens)
                </p>
              </button>
              <button
                type="button"
                onClick={() => setModoBot('economico')}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  modoBot === 'economico'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium">Economico</div>
                <p className="text-sm text-muted-foreground">
                  Respostas curtas e diretas (menos tokens)
                </p>
              </button>
            </div>
          </div>
        )}

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
