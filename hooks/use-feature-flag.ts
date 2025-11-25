import { useState, useEffect } from 'react'

export type FeatureFlagKey = 'importacaoEmMassa' | 'exportacaoRelatorios' | 'notificacoesWhatsapp'

export type FeatureFlags = {
  importacaoEmMassa: boolean
  exportacaoRelatorios: boolean
  notificacoesWhatsapp: boolean
}

// Cache das feature flags (compartilhado entre todos os hooks)
let cachedFlags: FeatureFlags | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Hook para verificar se uma feature flag está ativada
 *
 * @param flagKey - Nome da feature flag
 * @returns {boolean} - true se a flag estiver ativada, false caso contrário
 *
 * @example
 * const importEnabled = useFeatureFlag('importacaoEmMassa')
 *
 * if (importEnabled) {
 *   return <ImportButton />
 * }
 */
export function useFeatureFlag(flagKey: FeatureFlagKey): boolean {
  const [isEnabled, setIsEnabled] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchFeatureFlags() {
      try {
        // Verificar cache
        const now = Date.now()
        if (cachedFlags && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
          setIsEnabled(cachedFlags[flagKey] ?? false)
          setLoading(false)
          return
        }

        // Buscar do servidor
        const response = await fetch('/api/configuracoes/feature-flags')
        if (!response.ok) {
          console.error('[FEATURE FLAG] Erro ao buscar flags:', response.statusText)
          setIsEnabled(false)
          setLoading(false)
          return
        }

        const data = await response.json()

        if (data.success && data.featureFlags) {
          cachedFlags = data.featureFlags
          cacheTimestamp = Date.now()
          setIsEnabled(data.featureFlags[flagKey] ?? false)
        } else {
          setIsEnabled(false)
        }
      } catch (error) {
        console.error('[FEATURE FLAG] Erro ao buscar feature flags:', error)
        setIsEnabled(false)
      } finally {
        setLoading(false)
      }
    }

    fetchFeatureFlags()
  }, [flagKey])

  return isEnabled
}

/**
 * Hook para obter todas as feature flags
 *
 * @returns {object} - Objeto com flags e funções úteis
 *
 * @example
 * const { flags, loading, refetch } = useFeatureFlags()
 *
 * if (loading) return <Spinner />
 *
 * return (
 *   <div>
 *     {flags.importacaoEmMassa && <ImportButton />}
 *     {flags.exportacaoRelatorios && <ExportButton />}
 *   </div>
 * )
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>({
    importacaoEmMassa: false,
    exportacaoRelatorios: false,
    notificacoesWhatsapp: false,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeatureFlags = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar cache
      const now = Date.now()
      if (cachedFlags && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        setFlags(cachedFlags)
        setLoading(false)
        return
      }

      // Buscar do servidor
      const response = await fetch('/api/configuracoes/feature-flags')
      if (!response.ok) {
        throw new Error('Erro ao buscar feature flags')
      }

      const data = await response.json()

      if (data.success && data.featureFlags) {
        cachedFlags = data.featureFlags
        cacheTimestamp = Date.now()
        setFlags(data.featureFlags)
      } else {
        throw new Error('Resposta inválida do servidor')
      }
    } catch (err) {
      console.error('[FEATURE FLAGS] Erro:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeatureFlags()
  }, [])

  return {
    flags,
    loading,
    error,
    refetch: fetchFeatureFlags
  }
}

/**
 * Função helper para limpar o cache (útil após atualizar feature flags)
 */
export function clearFeatureFlagsCache() {
  cachedFlags = null
  cacheTimestamp = null
}
