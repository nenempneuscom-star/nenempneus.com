'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Flag,
  Upload,
  Download,
  Bell,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react'
import { useFeatureFlags, clearFeatureFlagsCache, type FeatureFlags } from '@/hooks/use-feature-flag'

interface FeatureFlagConfig {
  key: keyof FeatureFlags
  label: string
  description: string
  icon: React.ReactNode
  defaultValue: boolean
  warningMessage?: string
}

const featureFlagsConfig: FeatureFlagConfig[] = [
  {
    key: 'importacaoEmMassa',
    label: 'Importação em Massa de Produtos',
    description: 'Permite importar múltiplos produtos via arquivo Excel. Desative caso encontre problemas.',
    icon: <Upload className="h-4 w-4" />,
    defaultValue: false,
    warningMessage: 'Recurso experimental. Desative em caso de erros.'
  },
  {
    key: 'exportacaoRelatorios',
    label: 'Exportação de Relatórios',
    description: 'Permite exportar pedidos e relatórios em formato CSV/Excel.',
    icon: <Download className="h-4 w-4" />,
    defaultValue: true
  },
  {
    key: 'notificacoesWhatsapp',
    label: 'Notificações via WhatsApp',
    description: 'Envia notificações automáticas de pedidos e agendamentos via WhatsApp.',
    icon: <Bell className="h-4 w-4" />,
    defaultValue: true
  }
]

export function FeatureFlagsSection() {
  const { flags, loading: loadingFlags, error: errorFlags, refetch } = useFeatureFlags()
  const [localFlags, setLocalFlags] = useState<FeatureFlags>(flags)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalFlags(flags)
  }, [flags])

  useEffect(() => {
    // Verificar se há mudanças
    const changed = Object.keys(flags).some(
      key => flags[key as keyof FeatureFlags] !== localFlags[key as keyof FeatureFlags]
    )
    setHasChanges(changed)
  }, [flags, localFlags])

  const handleToggle = (key: keyof FeatureFlags) => {
    setLocalFlags(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    setMessage(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/configuracoes/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureFlags: localFlags })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar configurações')
      }

      setMessage({
        type: 'success',
        text: 'Configurações salvas com sucesso!'
      })

      // Limpar cache e recarregar
      clearFeatureFlagsCache()
      await refetch()
      setHasChanges(false)

    } catch (error) {
      console.error('[FEATURE FLAGS] Erro ao salvar:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao salvar configurações'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setLocalFlags(flags)
    setMessage(null)
  }

  if (errorFlags) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Recursos Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-4 w-4" />
            {errorFlags}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Recursos Avançados
            </CardTitle>
            <CardDescription>
              Habilite ou desabilite funcionalidades experimentais. Use para isolar problemas.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Feature Flags
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Aviso Informativo */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Controle de Funcionalidades</p>
            <p className="text-xs mt-1">
              Desative recursos caso encontre problemas. Isso permite isolar e resolver bugs de forma isolada.
            </p>
          </div>
        </div>

        {/* Mensagem de Sucesso/Erro */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message.text}
          </div>
        )}

        {/* Lista de Feature Flags */}
        {loadingFlags ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {featureFlagsConfig.map((config) => (
              <div
                key={config.key}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{config.icon}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={config.key}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {config.label}
                      </Label>
                      {!config.defaultValue && (
                        <Badge variant="secondary" className="text-xs">
                          Experimental
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                    {config.warningMessage && localFlags[config.key] && (
                      <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {config.warningMessage}
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  id={config.key}
                  checked={localFlags[config.key]}
                  onCheckedChange={() => handleToggle(config.key)}
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        )}

        {/* Botões de Ação */}
        {hasChanges && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
