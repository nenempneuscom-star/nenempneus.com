'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Permission } from '@/lib/permissions'
import { AlertCircle, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PermissionGuardProps {
  children: React.ReactNode
  requiredPermission: Permission
  userPermissions: Record<string, boolean>
  fallback?: React.ReactNode
}

/**
 * Componente de proteção de páginas baseado em permissões
 *
 * Uso:
 * <PermissionGuard requiredPermission="produtos" userPermissions={user.permissoes}>
 *   <ProdutosPage />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  requiredPermission,
  userPermissions,
  fallback,
}: PermissionGuardProps) {
  const router = useRouter()
  const hasPermission = userPermissions[requiredPermission] === true

  useEffect(() => {
    // Log de tentativa de acesso não autorizado
    if (!hasPermission) {
      console.warn(
        `[SEGURANÇA] Acesso negado à página que requer permissão: ${requiredPermission}`,
        {
          permissoesUsuario: userPermissions,
          timestamp: new Date().toISOString(),
        }
      )
    }
  }, [hasPermission, requiredPermission, userPermissions])

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-8">
        <Card className="w-full max-w-lg border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium mb-1">Permissão necessária:</p>
                <p className="text-muted-foreground">{requiredPermission}</p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground text-center">
              Entre em contato com um administrador para solicitar acesso a este módulo.
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={() => router.push('/dashboard')}
              >
                Ir para Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
