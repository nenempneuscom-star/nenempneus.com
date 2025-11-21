'use client'

import { useState, useEffect, useCallback } from 'react'
import { ConversasList } from '@/components/admin/ConversasList'
import { ChatWindow } from '@/components/admin/ChatWindow'
import { MessageInput } from '@/components/admin/MessageInput'

interface Conversa {
  id: string
  nomeContato: string | null
  telefone: string
  status: string
  modo: string
  totalMensagens: number
  ultimaMensagemEm: Date | null
}

interface ConversaComMensagens extends Conversa {
  mensagens: {
    id: string
    direcao: string
    conteudo: string
    createdAt: Date
    processadoPorIa: boolean
  }[]
}

export default function WhatsAppPage() {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null)
  const [conversaAtual, setConversaAtual] = useState<ConversaComMensagens | null>(null)
  const [loadingConversas, setLoadingConversas] = useState(true)
  const [loadingMensagens, setLoadingMensagens] = useState(false)

  // Carregar conversas
  const carregarConversas = useCallback(async () => {
    setLoadingConversas(true)
    try {
      const response = await fetch('/api/admin/whatsapp/conversas')
      const data = await response.json()

      if (response.ok) {
        setConversas(data.conversas || [])
      } else {
        console.error('Erro ao carregar conversas:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setLoadingConversas(false)
    }
  }, [])

  // Carregar mensagens de uma conversa
  const carregarConversa = useCallback(async (id: string) => {
    setLoadingMensagens(true)
    try {
      const response = await fetch(`/api/admin/whatsapp/mensagens?conversaId=${id}`)
      const data = await response.json()

      if (response.ok) {
        setConversaAtual(data.conversa)
      } else {
        console.error('Erro ao carregar conversa:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error)
    } finally {
      setLoadingMensagens(false)
    }
  }, [])

  // Carregar conversas ao montar
  useEffect(() => {
    carregarConversas()
  }, [carregarConversas])

  // Carregar mensagens quando seleciona conversa
  useEffect(() => {
    if (conversaSelecionada) {
      carregarConversa(conversaSelecionada)
    } else {
      setConversaAtual(null)
    }
  }, [conversaSelecionada, carregarConversa])

  // Polling para atualizar conversas a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      carregarConversas()
      if (conversaSelecionada) {
        carregarConversa(conversaSelecionada)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [carregarConversas, carregarConversa, conversaSelecionada])

  const handleMessageSent = () => {
    if (conversaSelecionada) {
      carregarConversa(conversaSelecionada)
    }
    carregarConversas()
  }

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* Lista de conversas */}
      <div className="w-80 flex-shrink-0">
        <ConversasList
          conversas={conversas}
          conversaSelecionada={conversaSelecionada}
          onSelectConversa={setConversaSelecionada}
          onRefresh={carregarConversas}
          loading={loadingConversas}
        />
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        <ChatWindow
          conversa={conversaAtual}
          loading={loadingMensagens}
        />
        {conversaAtual && (
          <MessageInput
            conversaId={conversaAtual.id}
            onMessageSent={handleMessageSent}
          />
        )}
      </div>
    </div>
  )
}
