'use client'

import { useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Bot, User, MessageSquare } from 'lucide-react'

interface Mensagem {
  id: string
  direcao: string
  conteudo: string
  createdAt: Date
  processadoPorIa: boolean
}

interface Conversa {
  id: string
  nomeContato: string | null
  telefone: string
  status: string
  modo: string
  mensagens: Mensagem[]
}

interface ChatWindowProps {
  conversa: Conversa | null
  loading?: boolean
}

export function ChatWindow({ conversa, loading }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversa?.mensagens])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Carregando mensagens...
      </div>
    )
  }

  if (!conversa) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
        <MessageSquare className="h-16 w-16 opacity-20" />
        <p>Selecione uma conversa para visualizar</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-background">
        <div>
          <h3 className="font-semibold">{conversa.nomeContato || 'Sem nome'}</h3>
          <p className="text-sm text-muted-foreground">{conversa.telefone}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={conversa.status === 'ativa' ? 'default' : 'secondary'}>
            {conversa.status}
          </Badge>
          <Badge variant={conversa.modo === 'bot' ? 'secondary' : 'default'}>
            {conversa.modo === 'bot' ? 'Bot' : 'Humano'}
          </Badge>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {conversa.mensagens.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhuma mensagem ainda
          </div>
        ) : (
          conversa.mensagens.map((msg) => {
            const isIncoming = msg.direcao === 'entrada'
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isIncoming ? '' : 'flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isIncoming ? 'bg-muted' : 'bg-primary'
                  }`}
                >
                  {isIncoming ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>

                {/* Mensagem */}
                <div
                  className={`flex-1 max-w-md space-y-1 ${
                    isIncoming ? 'text-left' : 'text-right'
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      isIncoming
                        ? 'bg-background text-foreground border'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                  </div>
                  <div className={`text-xs text-muted-foreground flex items-center gap-2 ${
                    isIncoming ? '' : 'justify-end'
                  }`}>
                    <span>{formatDate(msg.createdAt)}</span>
                    {msg.processadoPorIa && (
                      <Badge variant="outline" className="text-xs">
                        IA
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
