'use client'

import { useState } from 'react'
import {
    Save,
    Loader2,
    Calendar,
    CreditCard,
    MessageSquare,
    Store,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { FeatureFlagsSection } from './FeatureFlagsSection'

interface HorarioDia {
    inicio: string
    fim: string
}

interface Settings {
    horarioInicio: string
    horarioFim: string
    intervaloSlots: number
    clientesPorSlot: number
    diasFuncionamento: number[]
    horariosPorDia: Record<string, HorarioDia> | null
    intervaloAtivo: boolean
    intervaloInicio: string
    intervaloFim: string
    formasPagamento: string[]
    descontoPix: number
    parcelasMaximas: number
    taxaJuros: number
    botAtivo: boolean
    modoBot: string
}

const DIAS_SEMANA = [
    { valor: 0, nome: 'Domingo', abrev: 'Dom' },
    { valor: 1, nome: 'Segunda-feira', abrev: 'Seg' },
    { valor: 2, nome: 'Terça-feira', abrev: 'Ter' },
    { valor: 3, nome: 'Quarta-feira', abrev: 'Qua' },
    { valor: 4, nome: 'Quinta-feira', abrev: 'Qui' },
    { valor: 5, nome: 'Sexta-feira', abrev: 'Sex' },
    { valor: 6, nome: 'Sábado', abrev: 'Sáb' },
]

interface ConfiguracoesClientProps {
    initialSettings: Settings
}

export function ConfiguracoesClient({ initialSettings }: ConfiguracoesClientProps) {
    const [settings, setSettings] = useState<Settings>(initialSettings)
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    const handleChange = (key: keyof Settings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }))
        setHasChanges(true)
    }

    const handleFormaPagamentoToggle = (forma: string) => {
        const current = settings.formasPagamento
        const updated = current.includes(forma)
            ? current.filter(f => f !== forma)
            : [...current, forma]
        handleChange('formasPagamento', updated)
    }

    const handleDiaFuncionamentoToggle = (dia: number) => {
        const current = settings.diasFuncionamento || []
        const updated = current.includes(dia)
            ? current.filter(d => d !== dia)
            : [...current, dia].sort((a, b) => a - b)
        handleChange('diasFuncionamento', updated)
    }

    // Verificar se o dia tem horário personalizado
    const getDiaHorario = (dia: number): HorarioDia => {
        if (settings.horariosPorDia && settings.horariosPorDia[String(dia)]) {
            return settings.horariosPorDia[String(dia)]
        }
        // Retorna horário padrão
        return { inicio: settings.horarioInicio, fim: settings.horarioFim }
    }

    // Atualizar horário de um dia específico
    const handleHorarioDiaChange = (dia: number, campo: 'inicio' | 'fim', valor: string) => {
        const horariosPorDia = settings.horariosPorDia ? { ...settings.horariosPorDia } : {}

        if (!horariosPorDia[String(dia)]) {
            // Inicializar com valores padrão
            horariosPorDia[String(dia)] = {
                inicio: settings.horarioInicio,
                fim: settings.horarioFim
            }
        }

        horariosPorDia[String(dia)][campo] = valor
        handleChange('horariosPorDia', horariosPorDia)
    }

    // Verificar se um dia tem horário diferente do padrão
    const temHorarioDiferente = (dia: number): boolean => {
        if (!settings.horariosPorDia || !settings.horariosPorDia[String(dia)]) {
            return false
        }
        const horarioDia = settings.horariosPorDia[String(dia)]
        return horarioDia.inicio !== settings.horarioInicio || horarioDia.fim !== settings.horarioFim
    }

    // Resetar horário de um dia para o padrão
    const resetarHorarioDia = (dia: number) => {
        if (!settings.horariosPorDia) return

        const horariosPorDia = { ...settings.horariosPorDia }
        delete horariosPorDia[String(dia)]

        // Se não sobrou nenhum horário customizado, setar como null
        if (Object.keys(horariosPorDia).length === 0) {
            handleChange('horariosPorDia', null)
        } else {
            handleChange('horariosPorDia', horariosPorDia)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            if (!response.ok) throw new Error('Falha ao salvar')

            setHasChanges(false)
            toast({
                title: "Configurações salvas",
                description: "As alterações foram aplicadas com sucesso.",
            })
        } catch (error) {
            console.error('Erro ao salvar:', error)
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível salvar as alterações. Tente novamente.",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6 relative pb-20">
            <Tabs defaultValue="agendamento" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="agendamento">Agendamento</TabsTrigger>
                    <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
                    <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                    <TabsTrigger value="recursos">Recursos</TabsTrigger>
                </TabsList>

                {/* Agendamento */}
                <TabsContent value="agendamento" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Horários e Capacidade
                            </CardTitle>
                            <CardDescription>
                                Configure o funcionamento da sua agenda e capacidade de atendimento.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Horário de Início</Label>
                                    <Input
                                        type="time"
                                        value={settings.horarioInicio}
                                        onChange={(e) => handleChange('horarioInicio', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Horário de Fim</Label>
                                    <Input
                                        type="time"
                                        value={settings.horarioFim}
                                        onChange={(e) => handleChange('horarioFim', e.target.value)}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Intervalo entre Agendamentos (minutos)</Label>
                                    <Select
                                        value={String(settings.intervaloSlots)}
                                        onValueChange={(v) => handleChange('intervaloSlots', Number(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="30">30 minutos</SelectItem>
                                            <SelectItem value="45">45 minutos</SelectItem>
                                            <SelectItem value="60">1 hora</SelectItem>
                                            <SelectItem value="90">1 hora e 30 min</SelectItem>
                                            <SelectItem value="120">2 horas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Clientes por Horário</Label>
                                    <Select
                                        value={String(settings.clientesPorSlot)}
                                        onValueChange={(v) => handleChange('clientesPorSlot', Number(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 cliente</SelectItem>
                                            <SelectItem value="2">2 clientes</SelectItem>
                                            <SelectItem value="3">3 clientes</SelectItem>
                                            <SelectItem value="4">4 clientes</SelectItem>
                                            <SelectItem value="5">5 clientes</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dias de Funcionamento e Horários por Dia */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Dias e Horários de Funcionamento
                            </CardTitle>
                            <CardDescription>
                                Configure os dias da semana e horários específicos para cada dia.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Cards de cada dia */}
                            <div className="space-y-3">
                                {DIAS_SEMANA.map((dia) => {
                                    const isAtivo = settings.diasFuncionamento?.includes(dia.valor)
                                    const horario = getDiaHorario(dia.valor)
                                    const temDiferente = temHorarioDiferente(dia.valor)

                                    return (
                                        <div
                                            key={dia.valor}
                                            className={`p-4 rounded-lg border transition-all ${
                                                isAtivo
                                                    ? 'bg-background border-border'
                                                    : 'bg-muted/30 border-border opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                {/* Nome do dia + Switch */}
                                                <div className="flex items-center gap-3 min-w-[140px]">
                                                    <Switch
                                                        checked={isAtivo}
                                                        onCheckedChange={() => handleDiaFuncionamentoToggle(dia.valor)}
                                                    />
                                                    <div>
                                                        <span className="font-medium">{dia.nome}</span>
                                                        {!isAtivo && (
                                                            <span className="block text-xs text-destructive">Fechado</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Horários */}
                                                {isAtivo && (
                                                    <div className="flex items-center gap-2 flex-1 justify-end">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="time"
                                                                value={horario.inicio}
                                                                onChange={(e) => handleHorarioDiaChange(dia.valor, 'inicio', e.target.value)}
                                                                className="w-[110px]"
                                                            />
                                                            <span className="text-muted-foreground">às</span>
                                                            <Input
                                                                type="time"
                                                                value={horario.fim}
                                                                onChange={(e) => handleHorarioDiaChange(dia.valor, 'fim', e.target.value)}
                                                                className="w-[110px]"
                                                            />
                                                        </div>
                                                        {temDiferente && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => resetarHorarioDia(dia.valor)}
                                                                className="text-xs text-muted-foreground hover:text-foreground"
                                                            >
                                                                Usar padrão
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Legenda */}
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                    <strong>Dica:</strong> O horário padrão é {settings.horarioInicio} às {settings.horarioFim}.
                                    Você pode ajustar o horário de cada dia individualmente (ex: sábado até 12:00).
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Horário de Intervalo/Almoço */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Horário de Intervalo
                            </CardTitle>
                            <CardDescription>
                                Configure um período de intervalo (ex: almoço) onde não haverá agendamentos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Ativar Intervalo</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Bloquear horários durante o período de intervalo.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.intervaloAtivo}
                                    onCheckedChange={(v) => handleChange('intervaloAtivo', v)}
                                />
                            </div>

                            {settings.intervaloAtivo && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Início do Intervalo</Label>
                                        <Input
                                            type="time"
                                            value={settings.intervaloInicio}
                                            onChange={(e) => handleChange('intervaloInicio', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fim do Intervalo</Label>
                                        <Input
                                            type="time"
                                            value={settings.intervaloFim}
                                            onChange={(e) => handleChange('intervaloFim', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {settings.intervaloAtivo && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-sm text-amber-900">
                                        <strong>Intervalo configurado:</strong> {settings.intervaloInicio} às {settings.intervaloFim}
                                        <br />
                                        <span className="text-xs">Os horários neste período não estarão disponíveis para agendamento.</span>
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pagamento */}
                <TabsContent value="pagamento" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Formas de Pagamento
                            </CardTitle>
                            <CardDescription>
                                Gerencie como seus clientes podem pagar pelos serviços.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <Label className="text-base">Métodos Aceitos</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <span className="font-bold text-green-700 text-xs">PIX</span>
                                            </div>
                                            <div className="space-y-0.5">
                                                <Label className="text-base cursor-pointer" htmlFor="pix">PIX</Label>
                                                <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="pix"
                                            checked={settings.formasPagamento.includes('pix')}
                                            onCheckedChange={() => handleFormaPagamentoToggle('pix')}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <CreditCard className="h-5 w-5 text-blue-700" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <Label className="text-base cursor-pointer" htmlFor="cartao">Cartão de Crédito</Label>
                                                <p className="text-xs text-muted-foreground">Via Mercado Pago</p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="cartao"
                                            checked={settings.formasPagamento.includes('cartao')}
                                            onCheckedChange={() => handleFormaPagamentoToggle('cartao')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {settings.formasPagamento.includes('pix') && (
                                <div className="pt-4 border-t">
                                    <div className="space-y-2 max-w-xs">
                                        <Label>Desconto para PIX (%)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={settings.descontoPix}
                                                onChange={(e) => handleChange('descontoPix', Number(e.target.value))}
                                                className="pr-8"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Desconto aplicado automaticamente no checkout.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Parcelamento */}
                    {settings.formasPagamento.includes('cartao') && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    Parcelamento
                                </CardTitle>
                                <CardDescription>
                                    Configure as opções de parcelamento no cartão de crédito.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Parcelas Máximas</Label>
                                        <Select
                                            value={String(settings.parcelasMaximas)}
                                            onValueChange={(v) => handleChange('parcelasMaximas', Number(v))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">À vista (sem parcelas)</SelectItem>
                                                <SelectItem value="2">2x</SelectItem>
                                                <SelectItem value="3">3x</SelectItem>
                                                <SelectItem value="4">4x</SelectItem>
                                                <SelectItem value="5">5x</SelectItem>
                                                <SelectItem value="6">6x</SelectItem>
                                                <SelectItem value="8">8x</SelectItem>
                                                <SelectItem value="10">10x</SelectItem>
                                                <SelectItem value="12">12x</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Número máximo de parcelas oferecidas
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Taxa de Juros (% a.m.)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={settings.taxaJuros}
                                                onChange={(e) => handleChange('taxaJuros', Number(e.target.value))}
                                                className="pr-8"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {settings.taxaJuros === 0 ? '✓ Sem juros' : `Taxa aplicada: ${settings.taxaJuros}% a.m.`}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-900">
                                        <strong>Exemplo:</strong> Um produto de R$ 400,00 parcelado em {settings.parcelasMaximas}x {settings.taxaJuros === 0 ? 'sem juros' : `com ${settings.taxaJuros}% a.m. de juros`} = {settings.parcelasMaximas}x de R$ {(400 / settings.parcelasMaximas).toFixed(2)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* WhatsApp */}
                <TabsContent value="whatsapp" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Automação WhatsApp
                            </CardTitle>
                            <CardDescription>
                                Configure o comportamento do bot de atendimento.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Bot Ativo</Label>
                                    <p className="text-sm text-muted-foreground">
                                        O bot responderá automaticamente novas mensagens.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.botAtivo}
                                    onCheckedChange={(v) => handleChange('botAtivo', v)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Modo de Operação</Label>
                                <Select
                                    value={settings.modoBot}
                                    onValueChange={(v: string) => handleChange('modoBot', v)}
                                    disabled={!settings.botAtivo}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="comercial">Comercial (Vendas e Agendamento)</SelectItem>
                                        <SelectItem value="suporte">Apenas Suporte</SelectItem>
                                        <SelectItem value="triagem">Triagem Inicial</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Define a personalidade e o fluxo de conversa do bot.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Recursos Avançados / Feature Flags */}
                <TabsContent value="recursos" className="space-y-4 mt-6">
                    <FeatureFlagsSection />
                </TabsContent>
            </Tabs>

            {/* Floating Save Bar */}
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${hasChanges ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <div className="bg-foreground text-background px-6 py-3 rounded-full shadow-lg flex items-center gap-4">
                    <span className="font-medium text-sm">Você tem alterações não salvas</span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSettings(initialSettings)} // Reset
                            disabled={saving}
                        >
                            Descartar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
