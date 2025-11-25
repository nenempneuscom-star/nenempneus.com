'use client'

import { createContext, useContext } from 'react'
import { Permission, hasPermission, hasAllPermissions, hasAnyPermission } from '@/lib/permissions'

interface PermissionsContextType {
  permissoes: Record<string, boolean>
  hasPermission: (permission: Permission) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
}

const PermissionsContext = createContext<PermissionsContextType | null>(null)

interface PermissionsProviderProps {
  children: React.ReactNode
  permissoes: Record<string, boolean>
}

export function PermissionsProvider({ children, permissoes }: PermissionsProviderProps) {
  const value: PermissionsContextType = {
    permissoes,
    hasPermission: (permission) => hasPermission(permissoes, permission),
    hasAllPermissions: (permissions) => hasAllPermissions(permissoes, permissions),
    hasAnyPermission: (permissions) => hasAnyPermission(permissoes, permissions),
  }

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

/**
 * Hook para acessar permissões do usuário em qualquer componente
 *
 * Uso:
 * const { hasPermission } = usePermissions()
 * if (hasPermission('produtos')) { ... }
 */
export function usePermissions() {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider')
  }
  return context
}
