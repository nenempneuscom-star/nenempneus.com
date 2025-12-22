'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Search,
    MoreVertical,
    Phone,
    Video,
    Paperclip,
    Mic,
    Send,
    Check,
    CheckCheck,
    Smile,
    Bot,
    User,
    MessageSquare,
    Loader2,
    ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
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
    mensagens?: Mensagem[]
}

interface WhatsAppClientProps {
    initialConversas: Conversa[]
}

export function WhatsAppClient({ initialConversas }: WhatsAppClientProps) {
    const [conversas, setConversas] = useState<Conversa[]>(initialConversas)
    const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null)
    const [mensagens, setMensagens] = useState<Mensagem[]>([])
    const [loadingMensagens, setLoadingMensagens] = useState(false)
    const [mensagemTexto, setMensagemTexto] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [isMobileView, setIsMobileView] = useState(false)
    const [showChat, setShowChat] = useState(false)

    // Detect mobile view
    useEffect(() => {
        const checkMobile = () => setIsMobileView(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [mensagens])

    // Carregar conversas periodicamente
    const carregarConversas = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/whatsapp/conversas')
            const data = await response.json()
            if (response.ok) {
                setConversas(data.conversas)
            }
        } catch (error) {
            console.error('Erro ao carregar conversas:', error)
        }
    }, [])

    useEffect(() => {
        const interval = setInterval(carregarConversas, 30000)
        return () => clearInterval(interval)
    }, [carregarConversas])

    // Carregar mensagens quando selecionar conversa
    useEffect(() => {
        if (!conversaSelecionada) return

        const carregarMensagens = async () => {
            setLoadingMensagens(true)
            try {
                const response = await fetch(`/api/admin/whatsapp/mensagens?conversaId=${conversaSelecionada.id}`)
                const data = await response.json()
                if (response.ok && data.conversa) {
                    setMensagens(data.conversa.mensagens)
                }
            } catch (error) {
                console.error('Erro ao carregar mensagens:', error)
            } finally {
                setLoadingMensagens(false)
            }
        }

        carregarMensagens()

        // Polling de mensagens da conversa ativa
        const interval = setInterval(carregarMensagens, 10000)
        return () => clearInterval(interval)
    }, [conversaSelecionada])

    const handleSelectConversa = (conversa: Conversa) => {
        setConversaSelecionada(conversa)
        setShowChat(true)
    }

    const handleBackToConversas = () => {
        setShowChat(false)
        setConversaSelecionada(null)
    }

    const handleSendMessage = async () => {
        if (!mensagemTexto.trim() || !conversaSelecionada || enviando) return

        setEnviando(true)
        try {
            const response = await fetch('/api/admin/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversaId: conversaSelecionada.id,
                    mensagem: mensagemTexto.trim()
                })
            })

            if (response.ok) {
                setMensagemTexto('')
                // Recarregar mensagens imediatamente
                const msgsResponse = await fetch(`/api/admin/whatsapp/mensagens?conversaId=${conversaSelecionada.id}`)
                const data = await msgsResponse.json()
                if (msgsResponse.ok && data.conversa) {
                    setMensagens(data.conversa.mensagens)
                }
                // Atualizar lista de conversas para mostrar ultima mensagem
                carregarConversas()
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error)
        } finally {
            setEnviando(false)
        }
    }

    const filteredConversas = conversas.filter(c =>
        c.nomeContato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefone.includes(searchTerm)
    )

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return ''
        return format(new Date(dateStr), 'HH:mm')
    }

    const formatMessageDate = (dateStr: string) => {
        return format(new Date(dateStr), "dd/MM/yyyy HH:mm")
    }

    return (
        <div className="flex h-[calc(100vh-140px)] bg-background border rounded-xl overflow-hidden shadow-sm">
            {/* Sidebar - Lista de Conversas */}
            <div className={cn(
                "w-full md:w-[350px] flex flex-col border-r bg-background",
                showChat && isMobileView ? "hidden" : "flex"
            )}>
                {/* Header Sidebar */}
                <div className="p-4 bg-muted/30 border-b flex justify-between items-center h-[60px]">
                    <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">AD</AvatarFallback>
                    </Avatar>
                    <div className="flex gap-2 text-muted-foreground">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-3 border-b bg-background">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar ou começar uma nova conversa"
                            className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversas List */}
                <ScrollArea className="flex-1">
                    {filteredConversas.map((conversa) => (
                        <div
                            key={conversa.id}
                            onClick={() => handleSelectConversa(conversa)}
                            className={cn(
                                "flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 border-b border-border/40",
                                conversaSelecionada?.id === conversa.id && "bg-muted"
                            )}
                        >
                            <Avatar className="h-12 w-12">
                                <AvatarFallback className={cn(
                                    "font-semibold text-white",
                                    conversa.modo === 'bot' ? "bg-blue-500" : "bg-green-600"
                                )}>
                                    {conversa.nomeContato?.substring(0, 2).toUpperCase() || <User className="h-6 w-6" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-medium truncate text-foreground">
                                        {conversa.nomeContato || conversa.telefone}
                                    </span>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                        {formatTime(conversa.ultimaMensagemEm)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground truncate pr-2">
                                        {conversa.modo === 'bot' && (
                                            <Badge variant="secondary" className="mr-2 h-5 px-1 text-[10px]">BOT</Badge>
                                        )}
                                        {conversa.telefone}
                                    </p>
                                    {/* Badge de mensagens não lidas poderia vir aqui */}
                                </div>
                            </div>
                        </div>
                    ))}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a]",
                !showChat && isMobileView ? "hidden" : "flex"
            )}>
                {conversaSelecionada ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-[60px] px-4 py-2 bg-muted/30 border-b flex items-center justify-between bg-background z-10">
                            <div className="flex items-center gap-3">
                                {isMobileView && (
                                    <Button variant="ghost" size="icon" onClick={handleBackToConversas} className="mr-1">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                )}
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className={cn(
                                        "font-semibold text-white",
                                        conversaSelecionada.modo === 'bot' ? "bg-blue-500" : "bg-green-600"
                                    )}>
                                        {conversaSelecionada.nomeContato?.substring(0, 2).toUpperCase() || <User className="h-5 w-5" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">
                                        {conversaSelecionada.nomeContato || conversaSelecionada.telefone}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {conversaSelecionada.modo === 'bot' ? 'Atendimento Automático' : 'Atendimento Humano'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <Button variant="ghost" size="icon">
                                    <Search className="h-5 w-5" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Dados do contato</DropdownMenuItem>
                                        <DropdownMenuItem>Selecionar mensagens</DropdownMenuItem>
                                        <DropdownMenuItem>Silenciar notificações</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">Apagar conversa</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4"
                            style={{
                                backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                                backgroundRepeat: 'repeat',
                                backgroundSize: '400px'
                            }}
                        >
                            {loadingMensagens ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                mensagens.map((msg) => {
                                    const isIncoming = msg.direcao === 'entrada'
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex w-full",
                                                isIncoming ? "justify-start" : "justify-end"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "max-w-[85%] sm:max-w-[65%] rounded-lg px-3 py-2 shadow-sm relative text-sm",
                                                    isIncoming
                                                        ? "bg-white dark:bg-zinc-800 rounded-tl-none"
                                                        : "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none"
                                                )}
                                            >
                                                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
                                                    {msg.conteudo}
                                                </p>
                                                <div className="flex items-center justify-end gap-1 mt-1 select-none">
                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                        {format(new Date(msg.createdAt), 'HH:mm')}
                                                    </span>
                                                    {!isIncoming && (
                                                        <CheckCheck className="h-3 w-3 text-blue-500" />
                                                    )}
                                                </div>

                                                {/* Triângulo do balão */}
                                                <div className={cn(
                                                    "absolute top-0 w-0 h-0 border-[6px] border-transparent",
                                                    isIncoming
                                                        ? "left-[-6px] border-t-white dark:border-t-zinc-800 border-r-white dark:border-r-zinc-800"
                                                        : "right-[-6px] border-t-[#d9fdd3] dark:border-t-[#005c4b] border-l-[#d9fdd3] dark:border-l-[#005c4b]"
                                                )} />
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-muted/30 border-t bg-background flex items-end gap-2">
                            <Button variant="ghost" size="icon" className="text-muted-foreground mb-1">
                                <Smile className="h-6 w-6" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground mb-1">
                                <Paperclip className="h-6 w-6" />
                            </Button>

                            <div className="flex-1 bg-background rounded-lg border focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                                <Input
                                    value={mensagemTexto}
                                    onChange={(e) => setMensagemTexto(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMessage()
                                        }
                                    }}
                                    placeholder="Digite uma mensagem"
                                    className="border-none bg-transparent focus-visible:ring-0 min-h-[44px] py-3"
                                />
                            </div>

                            {mensagemTexto.trim() ? (
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={enviando}
                                    className="mb-1 rounded-full h-10 w-10 p-0 bg-[#00a884] hover:bg-[#008f6f]"
                                >
                                    {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                </Button>
                            ) : (
                                <Button variant="ghost" size="icon" className="text-muted-foreground mb-1">
                                    <Mic className="h-6 w-6" />
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center bg-background border-b-8 border-[#25d366]">
                        <div className="text-center space-y-4 max-w-md p-6">
                            <div className="mx-auto w-64 h-64 bg-contain bg-no-repeat bg-center opacity-80"
                                style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae.svg')" }}>
                            </div>
                            <h2 className="text-3xl font-light text-foreground">
                                WhatsApp Web Admin
                            </h2>
                            <p className="text-muted-foreground">
                                Envie e receba mensagens sem precisar manter seu celular conectado.
                                Use o WhatsApp em até 4 aparelhos e 1 celular ao mesmo tempo.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-8">
                                <Bot className="h-3 w-3" />
                                <span>Protegido com criptografia de ponta a ponta</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
