'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Shield, Calendar, Lock, Loader2, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PerfilClientProps {
    usuario: {
        id: string
        nome: string
        email: string
        role: string
        createdAt: Date
    }
}

export function PerfilClient({ usuario }: PerfilClientProps) {
    const [nome, setNome] = useState(usuario.nome)
    const [email, setEmail] = useState(usuario.email)
    const [senhaAtual, setSenhaAtual] = useState('')
    const [novaSenha, setNovaSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [salvandoPerfil, setSalvandoPerfil] = useState(false)
    const [salvandoSenha, setSalvandoSenha] = useState(false)
    const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'supremo':
                return <Badge className="bg-purple-500 hover:bg-purple-600">Supremo</Badge>
            case 'admin':
                return <Badge variant="secondary">Administrador</Badge>
            case 'funcionario':
                return <Badge variant="outline">Funcionário</Badge>
            default:
                return <Badge variant="outline">{role}</Badge>
        }
    }

    const handleSalvarPerfil = async (e: React.FormEvent) => {
        e.preventDefault()
        setSalvandoPerfil(true)
        setMensagem(null)

        try {
            const res = await fetch('/api/admin/perfil', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email }),
            })

            const data = await res.json()

            if (res.ok) {
                setMensagem({ tipo: 'sucesso', texto: 'Perfil atualizado com sucesso!' })
            } else {
                setMensagem({ tipo: 'erro', texto: data.error || 'Erro ao atualizar perfil' })
            }
        } catch {
            setMensagem({ tipo: 'erro', texto: 'Erro ao atualizar perfil' })
        } finally {
            setSalvandoPerfil(false)
        }
    }

    const handleAlterarSenha = async (e: React.FormEvent) => {
        e.preventDefault()

        if (novaSenha !== confirmarSenha) {
            setMensagem({ tipo: 'erro', texto: 'As senhas não coincidem' })
            return
        }

        if (novaSenha.length < 6) {
            setMensagem({ tipo: 'erro', texto: 'A nova senha deve ter pelo menos 6 caracteres' })
            return
        }

        setSalvandoSenha(true)
        setMensagem(null)

        try {
            const res = await fetch('/api/admin/perfil/senha', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senhaAtual, novaSenha }),
            })

            const data = await res.json()

            if (res.ok) {
                setMensagem({ tipo: 'sucesso', texto: 'Senha alterada com sucesso!' })
                setSenhaAtual('')
                setNovaSenha('')
                setConfirmarSenha('')
            } else {
                setMensagem({ tipo: 'erro', texto: data.error || 'Erro ao alterar senha' })
            }
        } catch {
            setMensagem({ tipo: 'erro', texto: 'Erro ao alterar senha' })
        } finally {
            setSalvandoSenha(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Informações do Perfil */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informações Pessoais
                    </CardTitle>
                    <CardDescription>Atualize suas informações de perfil</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSalvarPerfil} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome</Label>
                            <Input
                                id="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Seu nome"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                            />
                        </div>
                        <Button type="submit" disabled={salvandoPerfil}>
                            {salvandoPerfil && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Informações da Conta */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Informações da Conta
                    </CardTitle>
                    <CardDescription>Detalhes da sua conta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            E-mail
                        </div>
                        <span className="font-medium">{usuario.email}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            Nível de Acesso
                        </div>
                        {getRoleBadge(usuario.role)}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Membro desde
                        </div>
                        <span className="font-medium">
                            {format(new Date(usuario.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Alterar Senha */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Alterar Senha
                    </CardTitle>
                    <CardDescription>Mantenha sua conta segura com uma senha forte</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAlterarSenha} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="senhaAtual">Senha Atual</Label>
                                <Input
                                    id="senhaAtual"
                                    type="password"
                                    value={senhaAtual}
                                    onChange={(e) => setSenhaAtual(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="novaSenha">Nova Senha</Label>
                                <Input
                                    id="novaSenha"
                                    type="password"
                                    value={novaSenha}
                                    onChange={(e) => setNovaSenha(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                                <Input
                                    id="confirmarSenha"
                                    type="password"
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <Button type="submit" variant="outline" disabled={salvandoSenha}>
                            {salvandoSenha && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Alterar Senha
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Mensagem de feedback */}
            {mensagem && (
                <div className={`md:col-span-2 p-4 rounded-lg flex items-center gap-2 ${
                    mensagem.tipo === 'sucesso'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {mensagem.tipo === 'sucesso' && <CheckCircle className="h-5 w-5" />}
                    {mensagem.texto}
                </div>
            )}
        </div>
    )
}
