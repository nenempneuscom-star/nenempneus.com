'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock, User, Car, Loader2, Save, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface EditarAgendamentoFormProps {
    agendamento: any
}

export function EditarAgendamentoForm({ agendamento }: EditarAgendamentoFormProps) {
    const router = useRouter()
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState('')

    const [formData, setFormData] = useState({
        data: format(new Date(agendamento.data), 'yyyy-MM-dd'),
        hora: agendamento.hora instanceof Date
            ? format(agendamento.hora, 'HH:mm')
            : typeof agendamento.hora === 'string'
                ? agendamento.hora.substring(0, 5)
                : format(new Date(agendamento.hora), 'HH:mm'),
        status: agendamento.status,
        observacoes: agendamento.observacoes || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSalvando(true)
        setErro('')

        try {
            const res = await fetch(`/api/admin/agendamentos/${agendamento.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Erro ao atualizar agendamento')
            }

            router.push('/dashboard/agendamentos')
            router.refresh()
        } catch (error: any) {
            setErro(error.message)
        } finally {
            setSalvando(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
                <Button type="button" variant="outline" size="icon" asChild>
                    <Link href="/dashboard/agendamentos">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Informações do Cliente */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-muted-foreground">Nome</Label>
                            <p className="text-lg font-medium">{agendamento.cliente.nome}</p>
                        </div>
                        {agendamento.cliente.telefone && (
                            <div>
                                <Label className="text-muted-foreground">Telefone</Label>
                                <p className="font-medium">{agendamento.cliente.telefone}</p>
                            </div>
                        )}
                        {agendamento.cliente.veiculoMarca && (
                            <div>
                                <Label className="text-muted-foreground flex items-center gap-2">
                                    <Car className="h-4 w-4" />
                                    Veículo
                                </Label>
                                <p className="font-medium">
                                    {agendamento.cliente.veiculoMarca} {agendamento.cliente.veiculoModelo}
                                    {agendamento.cliente.veiculoPlaca && (
                                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded font-mono">
                                            {agendamento.cliente.veiculoPlaca}
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Informações do Agendamento */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Agendamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="data">Data *</Label>
                            <Input
                                id="data"
                                type="date"
                                value={formData.data}
                                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="hora" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Hora *
                            </Label>
                            <Input
                                id="hora"
                                type="time"
                                value={formData.hora}
                                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status *</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="confirmado">Confirmado</SelectItem>
                                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                    <SelectItem value="concluido">Concluído</SelectItem>
                                    <SelectItem value="cancelado">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Observações */}
            <Card>
                <CardHeader>
                    <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Adicione observações sobre o agendamento..."
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        rows={4}
                    />
                </CardContent>
            </Card>

            {/* Erro */}
            {erro && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">
                    {erro}
                </div>
            )}

            {/* Ações */}
            <div className="flex items-center gap-4">
                <Button type="submit" disabled={salvando}>
                    {salvando ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                        </>
                    )}
                </Button>
                <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard/agendamentos">Cancelar</Link>
                </Button>
            </div>
        </form>
    )
}
