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

interface Settings {
    horarioInicio: string
    horarioFim: string
    intervaloSlots: number
    clientesPorSlot: number
    formasPagamento: string[]
    descontoPix: number
    botAtivo: boolean
    modoBot: string
}

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
