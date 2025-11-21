'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'

interface MessageInputProps {
  conversaId: string
  onMessageSent: () => void
  disabled?: boolean
}

export function MessageInput({ conversaId, onMessageSent, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!message.trim() || sending || disabled) return

    setSending(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversaId,
          mensagem: message.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }

      // Limpar campo
      setMessage('')

      // Recarregar mensagens
      onMessageSent()
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err)
      setError(err.message || 'Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t p-4 bg-background">
      {error && (
        <div className="mb-2 text-sm text-red-500">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Textarea
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          className="min-h-[80px] resize-none"
          disabled={disabled || sending}
        />
        <Button
          onClick={handleSend}
          disabled={sending || !message.trim() || disabled}
          className="self-end"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Enter para enviar, Shift+Enter para quebra de linha
      </p>
    </div>
  )
}
