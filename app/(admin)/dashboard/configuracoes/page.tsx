import { getSettings } from '@/lib/admin/settings'
import { ConfiguracoesClient } from '@/components/admin/configuracoes/ConfiguracoesClient'

// Forçar renderização dinâmica para evitar erros de build
export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const settingsRaw = await getSettings()

  if (!settingsRaw) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Erro ao carregar configurações. Verifique se a loja está configurada corretamente.
        </div>
      </div>
    )
  }

  // Serializar dados se necessário (embora getSettings já retorne strings para horários)
  const settings = {
    ...settingsRaw,
    // Garantir que arrays sejam arrays
    formasPagamento: Array.isArray(settingsRaw.formasPagamento) ? settingsRaw.formasPagamento : [],
    diasFuncionamento: Array.isArray(settingsRaw.diasFuncionamento) ? settingsRaw.diasFuncionamento : [],
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground">Gerencie o funcionamento da sua loja.</p>
        </div>
      </div>

      <ConfiguracoesClient initialSettings={settings} />
    </div>
  )
}
