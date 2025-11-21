'use client'

import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { MessageSquare, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Conversa {
  id: string
  nomeContato: string | null
  telefone: string
  status: string
  modo: string
  totalMensagens: number
  ultimaMensagemEm: Date | null
}

interface ConversasListProps {
  conversas: Conversa[]
  conversaSelecionada: string | null
  onSelectConversa: (id: string) => void
  onRefresh: () => void
  loading?: boolean
}

export function ConversasList({
  conversas,
  conversaSelecionada,
  onSelectConversa,
  onRefresh,
  loading,
}: ConversasListProps) {
  return (
    <div className="border-r h-full overflow-y-auto bg-background">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversas
        </h3>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="divide-y">
        {conversas.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma conversa ainda
          </div>
        ) : (
          conversas.map((conversa) => (
            <button
              key={conversa.id}
              onClick={() => onSelectConversa(conversa.id)}
              className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                conversaSelecionada === conversa.id ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="font-medium text-sm truncate max-w-[140px]">
                  {conversa.nomeContato || 'Sem nome'}
                </span>
                <Badge
                  variant={conversa.modo === 'bot' ? 'secondary' : 'default'}
                  className="text-xs ml-2"
                >
                  {conversa.modo === 'bot' ? 'Bot' : 'Humano'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {conversa.telefone}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {conversa.totalMensagens} msgs
                </span>
                {conversa.ultimaMensagemEm && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(conversa.ultimaMensagemEm)}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
