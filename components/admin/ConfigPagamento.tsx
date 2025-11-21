'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2, Check } from 'lucide-react'

interface ConfigPagamentoProps {
  settings: {
    formasPagamento: string[]
    descontoPix: number
  } | null
  onSave: (data: any) => Promise<void>
}

export function ConfigPagamento({ settings, onSave }: ConfigPagamentoProps) {
  const [aceitaPix, setAceitaPix] = useState(true)
  const [aceitaCartao, setAceitaCartao] = useState(true)
  const [descontoPix, setDescontoPix] = useState(5)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      const formas = settings.formasPagamento || []
      setAceitaPix(formas.includes('pix'))
      setAceitaCartao(formas.includes('cartao'))
      setDescontoPix(settings.descontoPix || 5)
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const formasPagamento: string[] = []
      if (aceitaPix) formasPagamento.push('pix')
      if (aceitaCartao) formasPagamento.push('cartao')

      await onSave({
        formasPagamento,
        descontoPix,
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
          <CreditCard className="h-5 w-5" />
          Pagamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label>Formas de Pagamento</Label>

          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
            <input
              type="checkbox"
              checked={aceitaPix}
              onChange={(e) => setAceitaPix(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span>PIX</span>
          </label>

          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
            <input
              type="checkbox"
              checked={aceitaCartao}
              onChange={(e) => setAceitaCartao(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span>Cartao de Credito</span>
          </label>
        </div>

        <div className="space-y-2">
          <Label>Desconto PIX (%)</Label>
          <Input
            type="number"
            value={descontoPix}
            onChange={(e) => setDescontoPix(parseFloat(e.target.value) || 0)}
            min="0"
            max="100"
            step="0.5"
          />
          <p className="text-xs text-muted-foreground">
            Desconto aplicado em pagamentos via PIX
          </p>
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
