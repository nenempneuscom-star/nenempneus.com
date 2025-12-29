'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Search,
    Send,
    CheckCheck,
    Check,
    Bot,
    User,
    Phone,
    MoreVertical,
    Smile,
    Paperclip,
    ArrowLeft,
    Settings,
    LogOut,
    Filter,
    Star,
    Clock,
    MessageCircle,
    Users,
    TrendingUp,
    ChevronDown,
    X,
    ExternalLink,
    Copy,
    Bell,
    BellOff,
    Trash2,
    Archive,
    Pin,
    Tag,
    Menu,
    LayoutDashboard,
    ShoppingBag,
    Package,
    Calendar,
    Car
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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

type Filtro = 'todas' | 'bot' | 'humano' | 'favoritas'

export function WhatsAppCRM({ initialConversas }: { initialConversas: Conversa[] }) {
    // Estados
    const [conversas, setConversas] = useState<Conversa[]>(initialConversas)
    const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null)
    const [mensagens, setMensagens] = useState<Mensagem[]>([])
    const [loading, setLoading] = useState(false)
    const [texto, setTexto] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [busca, setBusca] = useState('')
    const [filtro, setFiltro] = useState<Filtro>('todas')
    const [showInfo, setShowInfo] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [favoritas, setFavoritas] = useState<Set<string>>(new Set())
    const [mobile, setMobile] = useState(false)
    const [showSidebar, setShowSidebar] = useState(true)
    const [showNavMenu, setShowNavMenu] = useState(false)

    // Refs
    const chatRef = useRef<HTMLDivElement>(null)
    const shouldScrollRef = useRef(true)
    const lastCountRef = useRef(0)
    const inputRef = useRef<HTMLInputElement>(null)

    // Detectar mobile
    useEffect(() => {
        const check = () => {
            const isMobile = window.innerWidth < 1024
            setMobile(isMobile)
            if (isMobile && conversaSelecionada) {
                setShowSidebar(false)
            }
        }
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [conversaSelecionada])

    // Scroll
    const scrollToBottom = useCallback(() => {
        if (chatRef.current && shouldScrollRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
    }, [])

    useEffect(() => {
        const newCount = mensagens.length
        if (lastCountRef.current === 0 || newCount > lastCountRef.current) {
            shouldScrollRef.current = true
            setTimeout(scrollToBottom, 50)
        }
        lastCountRef.current = newCount
    }, [mensagens, scrollToBottom])

    const handleScroll = useCallback(() => {
        if (!chatRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = chatRef.current
        shouldScrollRef.current = scrollHeight - scrollTop - clientHeight < 150
    }, [])

    // API calls
    const carregarConversas = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/whatsapp/conversas')
            const data = await res.json()
            if (res.ok) setConversas(data.conversas)
        } catch (e) {
            console.error('Erro:', e)
        }
    }, [])

    const carregarMensagens = useCallback(async () => {
        if (!conversaSelecionada) return
        try {
            const res = await fetch(`/api/admin/whatsapp/mensagens?conversaId=${conversaSelecionada.id}`)
            const data = await res.json()
            if (res.ok && data.conversa) {
                setMensagens(data.conversa.mensagens)
            }
        } catch (e) {
            console.error('Erro:', e)
        }
    }, [conversaSelecionada])

    // Polling
    useEffect(() => {
        const interval = setInterval(carregarConversas, 30000)
        return () => clearInterval(interval)
    }, [carregarConversas])

    useEffect(() => {
        if (!conversaSelecionada) return
        setLoading(true)
        lastCountRef.current = 0
        shouldScrollRef.current = true
        carregarMensagens().finally(() => setLoading(false))
        const interval = setInterval(carregarMensagens, 5000)
        return () => clearInterval(interval)
    }, [conversaSelecionada, carregarMensagens])

    // Ações
    const selecionarConversa = (c: Conversa) => {
        setConversaSelecionada(c)
        setMensagens([])
        setShowInfo(false)
        if (mobile) setShowSidebar(false)
        setTimeout(() => inputRef.current?.focus(), 100)
    }

    const voltarParaLista = () => {
        setShowSidebar(true)
        if (mobile) setConversaSelecionada(null)
    }

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
            console.error('Erro:', e)
        }
    }

    const enviarMensagem = async () => {
        if (!texto.trim() || !conversaSelecionada || enviando) return
        setEnviando(true)
        try {
            const res = await fetch('/api/admin/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversaId: conversaSelecionada.id, mensagem: texto.trim() })
            })
            if (res.ok) {
                setTexto('')
                shouldScrollRef.current = true
                await carregarMensagens()
                carregarConversas()
            }
        } catch (e) {
            console.error('Erro:', e)
        } finally {
            setEnviando(false)
        }
    }

    const toggleFavorita = (id: string) => {
        setFavoritas(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const copiarTelefone = (tel: string) => {
        navigator.clipboard.writeText(tel)
    }

    // Filtros
    const conversasFiltradas = conversas.filter(c => {
        const matchBusca = c.nomeContato?.toLowerCase().includes(busca.toLowerCase()) ||
            c.telefone.includes(busca)

        if (!matchBusca) return false

        switch (filtro) {
            case 'bot': return c.modo === 'bot'
            case 'humano': return c.modo === 'humano'
            case 'favoritas': return favoritas.has(c.id)
            default: return true
        }
    })

    // Stats
    const stats = {
        total: conversas.length,
        bot: conversas.filter(c => c.modo === 'bot').length,
        humano: conversas.filter(c => c.modo === 'humano').length
    }

    return (
        <div className="h-screen w-screen flex bg-[#111b21] overflow-hidden">
            {/* Sidebar - Lista de Conversas */}
            <div className={cn(
                "flex flex-col bg-[#111b21] border-r border-[#222d34] transition-all duration-300",
                mobile ? (showSidebar ? "w-full absolute inset-0 z-50" : "hidden") : "w-[420px]"
            )}>
                {/* Header */}
                <div className="h-[60px] px-4 flex items-center justify-between bg-[#202c33]">
                    <div className="flex items-center gap-3">
                        {/* Botão hambúrguer */}
                        <button
                            onClick={() => setShowNavMenu(!showNavMenu)}
                            className="p-2 -ml-2 rounded-full text-gray-400 hover:bg-[#2a3942] transition-colors"
                            title="Menu de navegação"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            NP
                        </div>
                        <div>
                            <h1 className="font-semibold text-white text-sm">Nenem Pneus</h1>
                            <p className="text-[11px] text-gray-400">CRM WhatsApp</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "p-2 rounded-full transition-colors",
                                showFilters ? "bg-[#00a884] text-white" : "text-gray-400 hover:bg-[#2a3942]"
                            )}
                        >
                            <Filter className="h-5 w-5" />
                        </button>
                        <Link
                            href="/dashboard"
                            className="p-2 rounded-full text-gray-400 hover:bg-[#2a3942] transition-colors"
                            title="Voltar ao Dashboard"
                        >
                            <LogOut className="h-5 w-5" />
                        </Link>
                    </div>
                </div>

                {/* Menu de navegação lateral */}
                {showNavMenu && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 z-40"
                            onClick={() => setShowNavMenu(false)}
                        />
                        <div className="fixed left-0 top-0 h-full w-64 bg-[#111b21] z-50 shadow-2xl flex flex-col">
                            <div className="h-[60px] px-4 flex items-center justify-between bg-[#202c33] border-b border-[#222d34]">
                                <span className="font-semibold text-white">Menu</span>
                                <button
                                    onClick={() => setShowNavMenu(false)}
                                    className="p-2 rounded-full text-gray-400 hover:bg-[#2a3942]"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <nav className="flex-1 p-3 space-y-1">
                                <Link
                                    href="/dashboard"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#2a3942] transition-colors"
                                >
                                    <LayoutDashboard className="h-5 w-5" />
                                    Dashboard
                                </Link>
                                <Link
                                    href="/dashboard/produtos"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#2a3942] transition-colors"
                                >
                                    <ShoppingBag className="h-5 w-5" />
                                    Produtos
                                </Link>
                                <Link
                                    href="/dashboard/pedidos"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#2a3942] transition-colors"
                                >
                                    <Package className="h-5 w-5" />
                                    Pedidos
                                </Link>
                                <Link
                                    href="/dashboard/agendamentos"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#2a3942] transition-colors"
                                >
                                    <Calendar className="h-5 w-5" />
                                    Agendamentos
                                </Link>
                                <Link
                                    href="/dashboard/veiculos"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#2a3942] transition-colors"
                                >
                                    <Car className="h-5 w-5" />
                                    Veículos
                                </Link>
                                <Link
                                    href="/dashboard/whatsapp"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#2a3942] transition-colors"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                    WhatsApp
                                </Link>
                                <div className="pt-2 border-t border-[#222d34] mt-2">
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#00a884]/20 text-[#00a884]">
                                        <MessageCircle className="h-5 w-5" />
                                        CRM WhatsApp
                                    </div>
                                </div>
                            </nav>
                        </div>
                    </>
                )}

                {/* Stats Bar */}
                <div className="px-4 py-2 bg-[#182229] border-b border-[#222d34] flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-gray-400">{stats.total} conversas</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <Bot className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-gray-400">{stats.bot}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <User className="h-3.5 w-3.5 text-orange-400" />
                        <span className="text-gray-400">{stats.humano}</span>
                    </div>
                </div>

                {/* Filtros */}
                {showFilters && (
                    <div className="px-3 py-2 bg-[#182229] border-b border-[#222d34] flex gap-2 overflow-x-auto">
                        {[
                            { key: 'todas', label: 'Todas', icon: MessageCircle },
                            { key: 'bot', label: 'Bot', icon: Bot },
                            { key: 'humano', label: 'Humano', icon: User },
                            { key: 'favoritas', label: 'Favoritas', icon: Star },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFiltro(f.key as Filtro)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                                    filtro === f.key
                                        ? "bg-[#00a884] text-white"
                                        : "bg-[#2a3942] text-gray-300 hover:bg-[#3a4a52]"
                                )}
                            >
                                <f.icon className="h-3.5 w-3.5" />
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Busca */}
                <div className="p-2 bg-[#111b21]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Pesquisar ou começar nova conversa"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#202c33] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                        />
                    </div>
                </div>

                {/* Lista de Conversas */}
                <div className="flex-1 overflow-y-auto">
                    {conversasFiltradas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                            <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
                            <p className="text-sm">Nenhuma conversa encontrada</p>
                        </div>
                    ) : (
                        conversasFiltradas.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => selecionarConversa(c)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-[#222d34] group",
                                    conversaSelecionada?.id === c.id
                                        ? "bg-[#2a3942]"
                                        : "hover:bg-[#202c33]"
                                )}
                            >
                                {/* Avatar */}
                                <div className="relative">
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0",
                                        c.modo === 'bot'
                                            ? "bg-gradient-to-br from-blue-400 to-blue-600"
                                            : "bg-gradient-to-br from-orange-400 to-orange-600"
                                    )}>
                                        {c.nomeContato?.substring(0, 2).toUpperCase() || <User className="h-5 w-5" />}
                                    </div>
                                    {/* Badge modo */}
                                    <div className={cn(
                                        "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111b21]",
                                        c.modo === 'bot' ? "bg-blue-500" : "bg-orange-500"
                                    )}>
                                        {c.modo === 'bot' ? (
                                            <Bot className="h-2.5 w-2.5 text-white" />
                                        ) : (
                                            <User className="h-2.5 w-2.5 text-white" />
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-medium text-white truncate text-[15px]">
                                            {c.nomeContato || c.telefone}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {favoritas.has(c.id) && (
                                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                            )}
                                            <span className="text-[11px] text-gray-500">
                                                {c.ultimaMensagemEm && formatDistanceToNow(new Date(c.ultimaMensagemEm), {
                                                    addSuffix: false,
                                                    locale: ptBR
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] text-gray-400 truncate">
                                            {c.telefone}
                                        </span>
                                        <span className="text-[11px] text-gray-500">
                                            • {c.totalMensagens} msgs
                                        </span>
                                    </div>
                                </div>

                                {/* Ação favorito */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleFavorita(c.id) }}
                                    className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-[#3a4a52] transition-all"
                                >
                                    <Star className={cn(
                                        "h-4 w-4",
                                        favoritas.has(c.id) ? "text-yellow-500 fill-yellow-500" : "text-gray-500"
                                    )} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-[#0b141a]",
                mobile && showSidebar ? "hidden" : "flex"
            )}>
                {conversaSelecionada ? (
                    <>
                        {/* Header do Chat */}
                        <div className="h-[60px] px-4 flex items-center justify-between bg-[#202c33] border-b border-[#222d34]">
                            <div className="flex items-center gap-3">
                                {mobile && (
                                    <button
                                        onClick={voltarParaLista}
                                        className="p-2 -ml-2 text-gray-400 hover:bg-[#2a3942] rounded-full"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                )}
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer",
                                        conversaSelecionada.modo === 'bot'
                                            ? "bg-gradient-to-br from-blue-400 to-blue-600"
                                            : "bg-gradient-to-br from-orange-400 to-orange-600"
                                    )}
                                    onClick={() => setShowInfo(!showInfo)}
                                >
                                    {conversaSelecionada.nomeContato?.substring(0, 2).toUpperCase() || <User className="h-4 w-4" />}
                                </div>
                                <div className="cursor-pointer" onClick={() => setShowInfo(!showInfo)}>
                                    <div className="font-medium text-white text-[15px]">
                                        {conversaSelecionada.nomeContato || conversaSelecionada.telefone}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        {conversaSelecionada.modo === 'bot' ? (
                                            <span className="flex items-center gap-1 text-blue-400">
                                                <Bot className="h-3 w-3" /> Cinthia IA
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-orange-400">
                                                <User className="h-3 w-3" /> Atendente
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="flex items-center gap-1">
                                {conversaSelecionada.modo === 'bot' ? (
                                    <button
                                        onClick={() => mudarModo('humano')}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-xs font-medium hover:bg-orange-500/30 transition-colors"
                                    >
                                        <User className="h-3.5 w-3.5" />
                                        Assumir
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => mudarModo('bot')}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors"
                                    >
                                        <Bot className="h-3.5 w-3.5" />
                                        Devolver IA
                                    </button>
                                )}
                                <a
                                    href={`https://wa.me/${conversaSelecionada.telefone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:bg-[#2a3942] rounded-full transition-colors"
                                    title="Abrir no WhatsApp"
                                >
                                    <ExternalLink className="h-5 w-5" />
                                </a>
                                <button
                                    onClick={() => setShowInfo(!showInfo)}
                                    className={cn(
                                        "p-2 rounded-full transition-colors",
                                        showInfo ? "bg-[#2a3942] text-white" : "text-gray-400 hover:bg-[#2a3942]"
                                    )}
                                >
                                    <MoreVertical className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Área principal */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Mensagens */}
                            <div className="flex-1 flex flex-col">
                                <div
                                    ref={chatRef}
                                    onScroll={handleScroll}
                                    className="flex-1 overflow-y-auto p-4 space-y-1"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                        backgroundColor: '#0b141a'
                                    }}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-gray-500 text-sm">Carregando mensagens...</span>
                                            </div>
                                        </div>
                                    ) : mensagens.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center text-gray-500">
                                                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                                <p>Nenhuma mensagem ainda</p>
                                            </div>
                                        </div>
                                    ) : (
                                        mensagens.map((msg, idx) => {
                                            const isEntrada = msg.direcao === 'entrada'
                                            const showDate = idx === 0 ||
                                                format(new Date(mensagens[idx - 1].createdAt), 'dd/MM/yyyy') !==
                                                format(new Date(msg.createdAt), 'dd/MM/yyyy')

                                            return (
                                                <div key={msg.id}>
                                                    {showDate && (
                                                        <div className="flex justify-center my-4">
                                                            <span className="px-3 py-1 bg-[#182229] rounded-lg text-[11px] text-gray-400 shadow">
                                                                {format(new Date(msg.createdAt), "dd 'de' MMMM", { locale: ptBR })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className={cn("flex mb-1", isEntrada ? "justify-start" : "justify-end")}>
                                                        <div
                                                            className={cn(
                                                                "max-w-[65%] px-3 py-2 rounded-lg shadow-sm relative",
                                                                isEntrada
                                                                    ? "bg-[#202c33] rounded-tl-none"
                                                                    : "bg-[#005c4b] rounded-tr-none"
                                                            )}
                                                        >
                                                            <p className="text-[14.5px] text-white whitespace-pre-wrap break-words leading-relaxed">
                                                                {msg.conteudo}
                                                            </p>
                                                            <div className="flex items-center justify-end gap-1 mt-1 -mb-0.5">
                                                                <span className="text-[11px] text-gray-400">
                                                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                                                </span>
                                                                {!isEntrada && (
                                                                    <CheckCheck className="h-4 w-4 text-[#53bdeb]" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>

                                {/* Input */}
                                <div className="px-4 py-3 bg-[#202c33] flex items-center gap-2">
                                    <button className="p-2 text-gray-400 hover:bg-[#2a3942] rounded-full transition-colors">
                                        <Smile className="h-6 w-6" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:bg-[#2a3942] rounded-full transition-colors">
                                        <Paperclip className="h-6 w-6" />
                                    </button>
                                    <div className="flex-1">
                                        <input
                                            ref={inputRef}
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
                                            className="w-full px-4 py-2.5 bg-[#2a3942] rounded-lg text-[15px] text-white placeholder-gray-500 focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={enviarMensagem}
                                        disabled={!texto.trim() || enviando}
                                        className={cn(
                                            "p-2.5 rounded-full transition-all",
                                            texto.trim()
                                                ? "bg-[#00a884] hover:bg-[#06cf9c] text-white"
                                                : "bg-transparent text-gray-500"
                                        )}
                                    >
                                        <Send className={cn("h-5 w-5", enviando && "animate-pulse")} />
                                    </button>
                                </div>
                            </div>

                            {/* Painel de Info */}
                            {showInfo && (
                                <div className="w-[320px] bg-[#111b21] border-l border-[#222d34] flex flex-col overflow-hidden">
                                    {/* Header */}
                                    <div className="h-[60px] px-4 flex items-center gap-4 bg-[#202c33]">
                                        <button
                                            onClick={() => setShowInfo(false)}
                                            className="p-1 text-gray-400 hover:bg-[#2a3942] rounded-full"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                        <span className="text-white font-medium">Info do contato</span>
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="flex-1 overflow-y-auto">
                                        {/* Avatar e nome */}
                                        <div className="p-6 flex flex-col items-center bg-[#111b21]">
                                            <div className={cn(
                                                "w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4",
                                                conversaSelecionada.modo === 'bot'
                                                    ? "bg-gradient-to-br from-blue-400 to-blue-600"
                                                    : "bg-gradient-to-br from-orange-400 to-orange-600"
                                            )}>
                                                {conversaSelecionada.nomeContato?.substring(0, 2).toUpperCase() || <User className="h-10 w-10" />}
                                            </div>
                                            <h3 className="text-xl text-white font-medium">
                                                {conversaSelecionada.nomeContato || 'Sem nome'}
                                            </h3>
                                            <p className="text-gray-400 text-sm">{conversaSelecionada.telefone}</p>
                                        </div>

                                        {/* Ações rápidas */}
                                        <div className="p-4 border-t border-[#222d34]">
                                            <div className="grid grid-cols-3 gap-2">
                                                <a
                                                    href={`https://wa.me/${conversaSelecionada.telefone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex flex-col items-center gap-1.5 p-3 bg-[#202c33] rounded-lg hover:bg-[#2a3942] transition-colors"
                                                >
                                                    <ExternalLink className="h-5 w-5 text-[#00a884]" />
                                                    <span className="text-[11px] text-gray-400">WhatsApp</span>
                                                </a>
                                                <button
                                                    onClick={() => copiarTelefone(conversaSelecionada.telefone)}
                                                    className="flex flex-col items-center gap-1.5 p-3 bg-[#202c33] rounded-lg hover:bg-[#2a3942] transition-colors"
                                                >
                                                    <Copy className="h-5 w-5 text-[#00a884]" />
                                                    <span className="text-[11px] text-gray-400">Copiar</span>
                                                </button>
                                                <button
                                                    onClick={() => toggleFavorita(conversaSelecionada.id)}
                                                    className="flex flex-col items-center gap-1.5 p-3 bg-[#202c33] rounded-lg hover:bg-[#2a3942] transition-colors"
                                                >
                                                    <Star className={cn(
                                                        "h-5 w-5",
                                                        favoritas.has(conversaSelecionada.id)
                                                            ? "text-yellow-500 fill-yellow-500"
                                                            : "text-[#00a884]"
                                                    )} />
                                                    <span className="text-[11px] text-gray-400">Favorito</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Detalhes */}
                                        <div className="p-4 border-t border-[#222d34]">
                                            <h4 className="text-[#00a884] text-xs font-medium mb-3">DETALHES</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <Phone className="h-4 w-4 text-gray-500" />
                                                    <span className="text-white text-sm">{conversaSelecionada.telefone}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <MessageCircle className="h-4 w-4 text-gray-500" />
                                                    <span className="text-white text-sm">{conversaSelecionada.totalMensagens} mensagens</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {conversaSelecionada.modo === 'bot' ? (
                                                        <>
                                                            <Bot className="h-4 w-4 text-blue-400" />
                                                            <span className="text-white text-sm">Atendido por Cinthia IA</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <User className="h-4 w-4 text-orange-400" />
                                                            <span className="text-white text-sm">Atendimento humano</span>
                                                        </>
                                                    )}
                                                </div>
                                                {conversaSelecionada.ultimaMensagemEm && (
                                                    <div className="flex items-center gap-3">
                                                        <Clock className="h-4 w-4 text-gray-500" />
                                                        <span className="text-white text-sm">
                                                            Última msg: {format(new Date(conversaSelecionada.ultimaMensagemEm), "dd/MM/yyyy 'às' HH:mm")}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Modo */}
                                        <div className="p-4 border-t border-[#222d34]">
                                            <h4 className="text-[#00a884] text-xs font-medium mb-3">MODO DE ATENDIMENTO</h4>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => mudarModo('bot')}
                                                    className={cn(
                                                        "flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                                        conversaSelecionada.modo === 'bot'
                                                            ? "bg-blue-500 text-white"
                                                            : "bg-[#202c33] text-gray-400 hover:bg-[#2a3942]"
                                                    )}
                                                >
                                                    <Bot className="h-4 w-4 inline mr-1.5" />
                                                    Cinthia IA
                                                </button>
                                                <button
                                                    onClick={() => mudarModo('humano')}
                                                    className={cn(
                                                        "flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                                        conversaSelecionada.modo === 'humano'
                                                            ? "bg-orange-500 text-white"
                                                            : "bg-[#202c33] text-gray-400 hover:bg-[#2a3942]"
                                                    )}
                                                >
                                                    <User className="h-4 w-4 inline mr-1.5" />
                                                    Humano
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Estado vazio */
                    <div className="flex-1 flex items-center justify-center bg-[#222e35]">
                        <div className="text-center max-w-md">
                            <div className="w-[320px] h-[188px] mx-auto mb-8 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-32 h-32 rounded-full bg-[#00a884]/10 flex items-center justify-center">
                                        <MessageCircle className="h-16 w-16 text-[#00a884]" />
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-[32px] font-light text-gray-200 mb-3">
                                Nenem Pneus CRM
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Envie e receba mensagens do WhatsApp.<br />
                                Gerencie seus atendimentos de forma profissional.
                            </p>
                            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-[#00a884]"></div>
                                    Criptografado
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
