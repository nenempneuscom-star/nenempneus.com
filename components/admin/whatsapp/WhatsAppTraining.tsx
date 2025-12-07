'use client'

import { useState, useEffect } from 'react'
import {
    Brain,
    ThumbsUp,
    ThumbsDown,
    Edit3,
    RefreshCcw,
    AlertTriangle,
    CheckCircle,
    Lightbulb,
    TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Estatisticas {
    total: number
    positivos: number
    negativos: number
    correcoes: number
    taxaPositiva: number
}

interface FeedbackItem {
    feedback: {
        id: string
        tipo: string
        feedback: string | null
        correcao: string | null
        createdAt: string
    }
    mensagem: {
        conteudo: string
        direcao: string
    } | null
    conversa: {
        telefone: string
        nomeContato: string | null
    } | null
}

export function WhatsAppTraining() {
    const [stats, setStats] = useState<Estatisticas | null>(null)
    const [sugestoes, setSugestoes] = useState<string[]>([])
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
    const [loading, setLoading] = useState(true)
    const [correcaoModal, setCorrecaoModal] = useState<{
        open: boolean
        conversaId?: string
        mensagemId?: string
        mensagemOriginal?: string
    }>({ open: false })
    const [correcaoTexto, setCorrecaoTexto] = useState('')
    const [enviandoCorrecao, setEnviandoCorrecao] = useState(false)

    const carregarDados = async () => {
        try {
            setLoading(true)
            const [statsRes, sugestoesRes, feedbacksRes] = await Promise.all([
                fetch('/api/admin/whatsapp/feedback?tipo=estatisticas'),
                fetch('/api/admin/whatsapp/feedback?tipo=sugestoes'),
                fetch('/api/admin/whatsapp/feedback'),
            ])

            if (statsRes.ok) {
                const data = await statsRes.json()
                setStats(data)
            }

            if (sugestoesRes.ok) {
                const data = await sugestoesRes.json()
                setSugestoes(data.sugestoes || [])
            }

            if (feedbacksRes.ok) {
                const data = await feedbacksRes.json()
                setFeedbacks(data.feedbacks || [])
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        carregarDados()
    }, [])

    const enviarCorrecao = async () => {
        if (!correcaoModal.conversaId || !correcaoModal.mensagemId || !correcaoTexto.trim()) {
            return
        }

        setEnviandoCorrecao(true)
        try {
            const response = await fetch('/api/admin/whatsapp/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversaId: correcaoModal.conversaId,
                    mensagemId: correcaoModal.mensagemId,
                    tipo: 'correcao',
                    correcao: correcaoTexto.trim(),
                }),
            })

            if (response.ok) {
                setCorrecaoModal({ open: false })
                setCorrecaoTexto('')
                carregarDados()
            }
        } catch (error) {
            console.error('Erro ao enviar correção:', error)
        } finally {
            setEnviandoCorrecao(false)
        }
    }

    if (loading && !stats) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <div className="h-6 bg-muted rounded w-40"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-20 bg-muted rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Treinamento da IA
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Analise e melhore as respostas da vendedora virtual
                    </p>
                </div>
                <Button variant="outline" onClick={carregarDados} disabled={loading}>
                    <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Atualizar
                </Button>
            </div>

            {/* Estatísticas */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total de Feedbacks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ThumbsUp className="h-4 w-4 text-green-500" />
                            Positivos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats?.positivos || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ThumbsDown className="h-4 w-4 text-red-500" />
                            Negativos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats?.negativos || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Taxa de Satisfação
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.taxaPositiva || 0}%</div>
                        <Progress value={stats?.taxaPositiva || 0} className="mt-2 h-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Sugestões de Melhoria */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        Sugestões de Melhoria
                    </CardTitle>
                    <CardDescription>
                        Recomendações baseadas na análise dos feedbacks
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {sugestoes.length > 0 ? (
                            sugestoes.map((sugestao, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg",
                                        sugestao.includes('✅') ? "bg-green-50 dark:bg-green-950/20" : "bg-yellow-50 dark:bg-yellow-950/20"
                                    )}
                                >
                                    {sugestao.includes('✅') ? (
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                    )}
                                    <p className="text-sm">{sugestao}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                Nenhuma sugestão no momento. Continue coletando feedbacks!
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Feedbacks Recentes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Edit3 className="h-5 w-5" />
                        Correções Recentes
                    </CardTitle>
                    <CardDescription>
                        Feedbacks negativos e correções sugeridas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {feedbacks.length > 0 ? (
                            feedbacks.slice(0, 10).map((item) => (
                                <div
                                    key={item.feedback.id}
                                    className="border rounded-lg p-4 space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={item.feedback.tipo === 'negativo' ? 'destructive' : 'secondary'}>
                                                {item.feedback.tipo}
                                            </Badge>
                                            {item.conversa?.nomeContato && (
                                                <span className="text-sm text-muted-foreground">
                                                    {item.conversa.nomeContato}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(item.feedback.createdAt).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>

                                    {item.mensagem && (
                                        <div className="bg-muted/50 rounded p-2">
                                            <p className="text-xs text-muted-foreground mb-1">Resposta da IA:</p>
                                            <p className="text-sm">{item.mensagem.conteudo}</p>
                                        </div>
                                    )}

                                    {item.feedback.correcao && (
                                        <div className="bg-green-50 dark:bg-green-950/20 rounded p-2">
                                            <p className="text-xs text-green-600 dark:text-green-400 mb-1">Correção sugerida:</p>
                                            <p className="text-sm">{item.feedback.correcao}</p>
                                        </div>
                                    )}

                                    {item.feedback.feedback && (
                                        <p className="text-sm text-muted-foreground">
                                            Comentário: {item.feedback.feedback}
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                <p>Nenhum feedback negativo registrado!</p>
                                <p className="text-sm">A IA está tendo uma boa performance.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Modal de Correção */}
            <Dialog open={correcaoModal.open} onOpenChange={(open) => setCorrecaoModal({ ...correcaoModal, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sugerir Correção</DialogTitle>
                        <DialogDescription>
                            Sugira como a IA deveria ter respondido nesta situação
                        </DialogDescription>
                    </DialogHeader>

                    {correcaoModal.mensagemOriginal && (
                        <div className="bg-muted rounded p-3">
                            <p className="text-xs text-muted-foreground mb-1">Resposta original:</p>
                            <p className="text-sm">{correcaoModal.mensagemOriginal}</p>
                        </div>
                    )}

                    <Textarea
                        placeholder="Digite a resposta correta que a IA deveria ter dado..."
                        value={correcaoTexto}
                        onChange={(e) => setCorrecaoTexto(e.target.value)}
                        rows={5}
                    />

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCorrecaoModal({ open: false })}>
                            Cancelar
                        </Button>
                        <Button onClick={enviarCorrecao} disabled={enviandoCorrecao || !correcaoTexto.trim()}>
                            {enviandoCorrecao ? 'Enviando...' : 'Enviar Correção'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
