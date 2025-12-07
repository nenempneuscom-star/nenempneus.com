'use client'

import { useState, useEffect } from 'react'
import {
    TrendingUp,
    TrendingDown,
    MessageSquare,
    Users,
    ShoppingCart,
    Target,
    Flame,
    Clock,
    RefreshCcw,
    ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface MetricasHoje {
    conversasNovas: number
    conversasAtivas: number
    totalMensagens: number
    mensagensEntrada: number
    mensagensSaida: number
    leadsNovos: number
    conversoes: number
    taxaConversao: number
}

interface LeadRecente {
    id: string
    nome: string | null
    telefone: string
    etapa: string
    pontuacao: number
    totalMensagens: number
    ultimaMensagem: string | null
}

interface Funil {
    etapa: string
    quantidade: number
    pontuacaoMedia: number
}

interface DashboardData {
    hoje: MetricasHoje | null
    totais7Dias: {
        conversas: number
        mensagens: number
        conversoes: number
        orcamentos: number
    }
    taxaConversaoGeral: number
    funil: {
        funil: Funil[]
        taxasConversao: Array<{ de: string; para: string; taxa: number }>
    } | null
    conversasRecentes: LeadRecente[]
}

const ETAPAS_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
    'novo': { label: 'Novo', color: 'bg-blue-500', emoji: '🆕' },
    'qualificando': { label: 'Qualificando', color: 'bg-cyan-500', emoji: '🔍' },
    'orcamento': { label: 'Orçamento', color: 'bg-yellow-500', emoji: '💰' },
    'negociando': { label: 'Negociando', color: 'bg-orange-500', emoji: '🤝' },
    'fechando': { label: 'Fechando', color: 'bg-red-500', emoji: '🔥' },
    'convertido': { label: 'Convertido', color: 'bg-green-500', emoji: '✅' },
    'perdido': { label: 'Perdido', color: 'bg-gray-500', emoji: '❌' },
}

function getPontuacaoInfo(pontuacao: number) {
    if (pontuacao >= 70) return { emoji: '🔥', label: 'Muito Quente', color: 'text-red-500' }
    if (pontuacao >= 50) return { emoji: '🟠', label: 'Quente', color: 'text-orange-500' }
    if (pontuacao >= 30) return { emoji: '🟡', label: 'Morno', color: 'text-yellow-500' }
    return { emoji: '🔵', label: 'Frio', color: 'text-blue-500' }
}

export function WhatsAppMetrics() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const carregarDados = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/whatsapp/metricas')
            if (!response.ok) throw new Error('Erro ao carregar métricas')
            const result = await response.json()
            setData(result)
            setError(null)
        } catch (err) {
            setError('Não foi possível carregar as métricas')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        carregarDados()
        const interval = setInterval(carregarDados, 60000) // Atualiza a cada minuto
        return () => clearInterval(interval)
    }, [])

    if (loading && !data) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                            <div className="h-4 bg-muted rounded w-24"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-muted rounded w-16"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-6">
                    <div className="text-center text-muted-foreground">
                        <p>{error}</p>
                        <Button variant="outline" onClick={carregarDados} className="mt-4">
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Tentar novamente
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const hoje = data?.hoje || {
        conversasNovas: 0,
        conversasAtivas: 0,
        totalMensagens: 0,
        leadsNovos: 0,
        conversoes: 0,
        taxaConversao: 0,
    }

    return (
        <div className="space-y-6">
            {/* Métricas Principais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Conversas Hoje</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{hoje.conversasAtivas}</div>
                        <p className="text-xs text-muted-foreground">
                            {hoje.conversasNovas} novas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{hoje.totalMensagens}</div>
                        <p className="text-xs text-muted-foreground">
                            {data?.totais7Dias.mensagens || 0} nos últimos 7 dias
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Conversões</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{hoje.conversoes}</div>
                        <p className="text-xs text-muted-foreground">
                            {data?.totais7Dias.conversoes || 0} nos últimos 7 dias
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data?.taxaConversaoGeral || 0}%
                        </div>
                        <Progress
                            value={data?.taxaConversaoGeral || 0}
                            className="mt-2 h-2"
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Funil de Vendas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Funil de Vendas
                        </CardTitle>
                        <CardDescription>Distribuição de leads por etapa</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data?.funil?.funil
                                .filter(f => f.etapa !== 'perdido')
                                .map((etapa, index) => {
                                    const config = ETAPAS_LABELS[etapa.etapa] || { label: etapa.etapa, color: 'bg-gray-500', emoji: '📌' }
                                    const maxQtd = Math.max(...(data?.funil?.funil.map(f => f.quantidade) || [1]))
                                    const width = maxQtd > 0 ? (etapa.quantidade / maxQtd) * 100 : 0

                                    return (
                                        <div key={etapa.etapa} className="flex items-center gap-3">
                                            <span className="text-lg">{config.emoji}</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>{config.label}</span>
                                                    <span className="font-medium">{etapa.quantidade}</span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all", config.color)}
                                                        style={{ width: `${width}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    </CardContent>
                </Card>

                {/* Leads Recentes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Flame className="h-5 w-5" />
                            Leads Quentes
                        </CardTitle>
                        <CardDescription>Leads com maior pontuação</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data?.conversasRecentes
                                ?.sort((a, b) => b.pontuacao - a.pontuacao)
                                .slice(0, 5)
                                .map((lead) => {
                                    const pontuacaoInfo = getPontuacaoInfo(lead.pontuacao)
                                    const etapaConfig = ETAPAS_LABELS[lead.etapa] || { label: lead.etapa, color: 'bg-gray-500' }

                                    return (
                                        <div
                                            key={lead.id}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{pontuacaoInfo.emoji}</span>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {lead.nome || lead.telefone}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn("text-[10px] h-5", etapaConfig.color, "text-white")}
                                                        >
                                                            {etapaConfig.label}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {lead.totalMensagens} msgs
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn("font-bold", pontuacaoInfo.color)}>
                                                    {lead.pontuacao}
                                                </span>
                                                <p className="text-[10px] text-muted-foreground">pontos</p>
                                            </div>
                                        </div>
                                    )
                                })}

                            {(!data?.conversasRecentes || data.conversasRecentes.length === 0) && (
                                <p className="text-center text-muted-foreground py-4">
                                    Nenhum lead encontrado
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Atualização */}
            <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={carregarDados} disabled={loading}>
                    <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Atualizar
                </Button>
            </div>
        </div>
    )
}
