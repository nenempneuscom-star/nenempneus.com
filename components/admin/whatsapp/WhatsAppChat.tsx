'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Search,
    MoreVertical,
    Send,
    CheckCheck,
    Bot,
    User,
    MessageSquare,
    Loader2,
    ArrowLeft,
    Phone
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Mensagem {
    id: string
    direcao: string
    conteudo: string
    createdAt: string
    processadoPorIa: boolean
}

interface Conversa {
    id: string
    nomeContato: string | null
    telefone: string
    status: string
    modo: string
    totalMensagens: number
    ultimaMensagemEm: string | null
}

export function WhatsAppChat({ initialConversas }: { initialConversas: Conversa[] }) {
    const [conversas, setConversas] = useState<Conversa[]>(initialConversas)
    const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null)
    const [mensagens, setMensagens] = useState<Mensagem[]>([])
    const [loading, setLoading] = useState(false)
    const [texto, setTexto] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [busca, setBusca] = useState('')
    const [mobile, setMobile] = useState(false)
    const [showChat, setShowChat] = useState(false)

    const chatContainerRef = useRef<HTMLDivElement>(null)
    const shouldScrollRef = useRef(true)
    const lastMessageCountRef = useRef(0)

    // Detectar mobile
    useEffect(() => {
        const check = () => setMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    // Scroll para o final - SIMPLES
    const scrollToBottom = useCallback(() => {
        if (chatContainerRef.current && shouldScrollRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [])

    // Quando mensagens mudam
    useEffect(() => {
        const newCount = mensagens.length
        const oldCount = lastMessageCountRef.current

        // Scroll só se: primeira vez OU mensagem nova
        if (oldCount === 0 || newCount > oldCount) {
            shouldScrollRef.current = true
            setTimeout(scrollToBottom, 50)
        }

        lastMessageCountRef.current = newCount
    }, [mensagens, scrollToBottom])

    // Detectar se usuário scrollou pra cima
    const handleScroll = useCallback(() => {
        if (!chatContainerRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 150
        shouldScrollRef.current = isAtBottom
    }, [])

    // Carregar conversas
    const carregarConversas = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/whatsapp/conversas')
            const data = await res.json()
            if (res.ok) setConversas(data.conversas)
        } catch (e) {
            console.error('Erro ao carregar conversas:', e)
        }
    }, [])

    // Carregar mensagens
    const carregarMensagens = useCallback(async () => {
        if (!conversaSelecionada) return
        try {
            const res = await fetch(`/api/admin/whatsapp/mensagens?conversaId=${conversaSelecionada.id}`)
            const data = await res.json()
            if (res.ok && data.conversa) {
                setMensagens(data.conversa.mensagens)
            }
        } catch (e) {
            console.error('Erro ao carregar mensagens:', e)
        }
    }, [conversaSelecionada])

    // Polling conversas
    useEffect(() => {
        const interval = setInterval(carregarConversas, 30000)
        return () => clearInterval(interval)
    }, [carregarConversas])

    // Polling mensagens
    useEffect(() => {
        if (!conversaSelecionada) return

        setLoading(true)
        lastMessageCountRef.current = 0
        shouldScrollRef.current = true

        carregarMensagens().finally(() => setLoading(false))

        const interval = setInterval(carregarMensagens, 8000)
        return () => clearInterval(interval)
    }, [conversaSelecionada, carregarMensagens])

    // Selecionar conversa
    const selecionarConversa = (c: Conversa) => {
        setConversaSelecionada(c)
        setShowChat(true)
        setMensagens([])
    }

    // Voltar (mobile)
    const voltar = () => {
        setShowChat(false)
        setConversaSelecionada(null)
    }

    // Mudar modo
    const mudarModo = async (modo: 'bot' | 'humano') => {
        if (!conversaSelecionada) return
        try {
            const res = await fetch('/api/admin/whatsapp/modo', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversaId: conversaSelecionada.id, modo })
            })
            if (res.ok) {
                setConversaSelecionada({ ...conversaSelecionada, modo })
                carregarConversas()
            }
        } catch (e) {
            console.error('Erro ao mudar modo:', e)
        }
    }

    // Enviar mensagem
    const enviarMensagem = async () => {
        if (!texto.trim() || !conversaSelecionada || enviando) return

        setEnviando(true)
        try {
            const res = await fetch('/api/admin/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversaId: conversaSelecionada.id,
                    mensagem: texto.trim()
                })
            })

            if (res.ok) {
                setTexto('')
                shouldScrollRef.current = true
                await carregarMensagens()
                carregarConversas()
            }
        } catch (e) {
            console.error('Erro ao enviar:', e)
        } finally {
            setEnviando(false)
        }
    }

    // Filtrar conversas
    const conversasFiltradas = conversas.filter(c =>
        c.nomeContato?.toLowerCase().includes(busca.toLowerCase()) ||
        c.telefone.includes(busca)
    )

    return (
        <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-lg border">
            {/* Lista de Conversas */}
            <div className={cn(
                "w-full md:w-[380px] flex flex-col border-r bg-white dark:bg-zinc-900",
                showChat && mobile ? "hidden" : "flex"
            )}>
                {/* Header */}
                <div className="h-16 px-4 flex items-center justify-between bg-[#f0f2f5] dark:bg-zinc-800 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#25d366] flex items-center justify-center text-white font-bold">
                            NP
                        </div>
                        <span className="font-semibold hidden sm:block">Nenem Pneus</span>
                    </div>
                </div>

                {/* Busca */}
                <div className="p-2 bg-white dark:bg-zinc-900">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Pesquisar conversa..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] dark:bg-zinc-800 rounded-lg text-sm focus:outline-none"
                        />
                    </div>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto">
                    {conversasFiltradas.map((c) => (
                        <div
                            key={c.id}
                            onClick={() => selecionarConversa(c)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800",
                                conversaSelecionada?.id === c.id && "bg-[#f0f2f5] dark:bg-zinc-800"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0",
                                c.modo === 'bot' ? "bg-blue-500" : "bg-green-600"
                            )}>
                                {c.nomeContato?.substring(0, 2).toUpperCase() || <User className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium truncate">
                                        {c.nomeContato || c.telefone}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {c.ultimaMensagemEm && format(new Date(c.ultimaMensagemEm), 'HH:mm')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {c.modo === 'bot' && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">BOT</span>
                                    )}
                                    <span className="text-sm text-gray-500 truncate">{c.telefone}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Área do Chat */}
            <div className={cn(
                "flex-1 flex flex-col",
                !showChat && mobile ? "hidden" : "flex"
            )}>
                {conversaSelecionada ? (
                    <>
                        {/* Header do Chat */}
                        <div className="h-16 px-4 flex items-center justify-between bg-[#f0f2f5] dark:bg-zinc-800 border-b">
                            <div className="flex items-center gap-3">
                                {mobile && (
                                    <button onClick={voltar} className="p-2 -ml-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full">
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                )}
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold",
                                    conversaSelecionada.modo === 'bot' ? "bg-blue-500" : "bg-green-600"
                                )}>
                                    {conversaSelecionada.nomeContato?.substring(0, 2).toUpperCase() || <User className="h-4 w-4" />}
                                </div>
                                <div>
                                    <div className="font-medium">
                                        {conversaSelecionada.nomeContato || conversaSelecionada.telefone}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs">
                                        {conversaSelecionada.modo === 'bot' ? (
                                            <span className="text-blue-600 flex items-center gap-1">
                                                <Bot className="h-3 w-3" /> Cinthia IA
                                            </span>
                                        ) : (
                                            <span className="text-green-600 flex items-center gap-1">
                                                <User className="h-3 w-3" /> Atendente
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {conversaSelecionada.modo === 'bot' ? (
                                    <button
                                        onClick={() => mudarModo('humano')}
                                        className="px-3 py-1.5 text-xs font-medium border border-green-500 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-1"
                                    >
                                        <User className="h-3.5 w-3.5" /> Assumir
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => mudarModo('bot')}
                                        className="px-3 py-1.5 text-xs font-medium border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-1"
                                    >
                                        <Bot className="h-3.5 w-3.5" /> Devolver IA
                                    </button>
                                )}
                                <a
                                    href={`https://wa.me/${conversaSelecionada.telefone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full"
                                    title="Abrir no WhatsApp"
                                >
                                    <Phone className="h-5 w-5 text-gray-600" />
                                </a>
                            </div>
                        </div>

                        {/* Mensagens */}
                        <div
                            ref={chatContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto p-4"
                            style={{
                                backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                                backgroundRepeat: 'repeat',
                                backgroundSize: '400px'
                            }}
                        >
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {mensagens.map((msg) => {
                                        const isEntrada = msg.direcao === 'entrada'
                                        return (
                                            <div
                                                key={msg.id}
                                                className={cn("flex", isEntrada ? "justify-start" : "justify-end")}
                                            >
                                                <div
                                                    className={cn(
                                                        "max-w-[80%] md:max-w-[65%] px-3 py-2 rounded-lg shadow-sm",
                                                        isEntrada
                                                            ? "bg-white dark:bg-zinc-800 rounded-tl-none"
                                                            : "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none"
                                                    )}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
                                                        {msg.conteudo}
                                                    </p>
                                                    <div className="flex items-center justify-end gap-1 mt-1">
                                                        <span className="text-[10px] text-gray-500">
                                                            {format(new Date(msg.createdAt), 'HH:mm')}
                                                        </span>
                                                        {!isEntrada && <CheckCheck className="h-3 w-3 text-blue-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-[#f0f2f5] dark:bg-zinc-800 border-t flex items-center gap-2">
                            <input
                                type="text"
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        enviarMensagem()
                                    }
                                }}
                                placeholder="Digite uma mensagem"
                                className="flex-1 px-4 py-3 bg-white dark:bg-zinc-900 rounded-lg text-sm focus:outline-none"
                            />
                            <button
                                onClick={enviarMensagem}
                                disabled={!texto.trim() || enviando}
                                className={cn(
                                    "p-3 rounded-full transition-colors",
                                    texto.trim()
                                        ? "bg-[#00a884] hover:bg-[#008f6f] text-white"
                                        : "bg-gray-200 dark:bg-zinc-700 text-gray-400"
                                )}
                            >
                                {enviando ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    /* Estado vazio */
                    <div className="flex-1 flex items-center justify-center bg-[#f0f2f5] dark:bg-zinc-800">
                        <div className="text-center space-y-4 p-8">
                            <div className="w-24 h-24 mx-auto rounded-full bg-[#25d366]/10 flex items-center justify-center">
                                <MessageSquare className="h-12 w-12 text-[#25d366]" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                                Central de Atendimento
                            </h2>
                            <p className="text-sm text-gray-500 max-w-sm">
                                Selecione uma conversa para visualizar as mensagens
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
