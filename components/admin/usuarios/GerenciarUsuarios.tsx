'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Users,
    UserPlus,
    Loader2,
    Trash2,
    CheckCircle,
    XCircle,
    Shield,
    Settings,
    Package,
    ShoppingCart,
    Calendar,
    MessageSquare,
    LayoutDashboard
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Permissoes {
    dashboard: boolean
    produtos: boolean
    pedidos: boolean
    agendamentos: boolean
    whatsapp: boolean
    configuracoes: boolean
    usuarios: boolean
}

interface Usuario {
    id: string
    nome: string
    email: string
    role: string
    permissoes: Permissoes
    ativo: boolean
    ultimoLogin?: string | null
    createdAt: string
}

interface GerenciarUsuariosProps {
    usuarioAtualId: string
    usuarioRole: string
}

const PERMISSOES_CONFIG = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, descricao: 'Ver painel inicial' },
    { key: 'produtos', label: 'Produtos', icon: Package, descricao: 'Gerenciar catálogo' },
    { key: 'pedidos', label: 'Pedidos', icon: ShoppingCart, descricao: 'Ver e gerenciar pedidos' },
    { key: 'agendamentos', label: 'Agendamentos', icon: Calendar, descricao: 'Gerenciar agenda' },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, descricao: 'Ver conversas' },
    { key: 'configuracoes', label: 'Configurações', icon: Settings, descricao: 'Alterar configurações' },
    { key: 'usuarios', label: 'Usuários', icon: Users, descricao: 'Gerenciar usuários' },
] as const

export function GerenciarUsuarios({ usuarioAtualId, usuarioRole }: GerenciarUsuariosProps) {
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [loading, setLoading] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [dialogAberto, setDialogAberto] = useState(false)
    const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
    const [usuarioEditando, setUsuarioEditando] = useState<string | null>(null)

    // Form para novo usuário
    const [novoUsuario, setNovoUsuario] = useState({
        nome: '',
        email: '',
        senha: '',
        role: 'funcionario',
        permissoes: {
            dashboard: true,
            produtos: true,
            pedidos: true,
            agendamentos: true,
            whatsapp: false,
            configuracoes: false,
            usuarios: false
        } as Permissoes
    })

    useEffect(() => {
        carregarUsuarios()
    }, [])

    const carregarUsuarios = async () => {
        try {
            const res = await fetch('/api/admin/usuarios')
            if (res.ok) {
                const data = await res.json()
                setUsuarios(data)
            }
        } catch (error) {
            console.error('Erro ao carregar usuários:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCriarUsuario = async () => {
        if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha) {
            setMensagem({ tipo: 'erro', texto: 'Preencha todos os campos obrigatórios' })
            return
        }

        setSalvando(true)
        setMensagem(null)

        try {
            const res = await fetch('/api/admin/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoUsuario)
            })

            if (res.ok) {
                const data = await res.json()
                setUsuarios([data, ...usuarios])
                setDialogAberto(false)
                setNovoUsuario({
                    nome: '',
                    email: '',
                    senha: '',
                    role: 'funcionario',
                    permissoes: {
                        dashboard: true,
                        produtos: true,
                        pedidos: true,
                        agendamentos: true,
                        whatsapp: false,
                        configuracoes: false,
                        usuarios: false
                    }
                })
                setMensagem({ tipo: 'sucesso', texto: 'Usuário criado com sucesso!' })
            } else {
                const error = await res.json()
                setMensagem({ tipo: 'erro', texto: error.error || 'Erro ao criar usuário' })
            }
        } catch {
            setMensagem({ tipo: 'erro', texto: 'Erro ao criar usuário' })
        } finally {
            setSalvando(false)
        }
    }

    const handleTogglePermissao = async (usuarioId: string, permissao: keyof Permissoes) => {
        const usuario = usuarios.find(u => u.id === usuarioId)
        if (!usuario) return

        const novasPermissoes = {
            ...usuario.permissoes,
            [permissao]: !usuario.permissoes[permissao]
        }

        setUsuarioEditando(usuarioId)

        try {
            const res = await fetch(`/api/admin/usuarios/${usuarioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissoes: novasPermissoes })
            })

            if (res.ok) {
                setUsuarios(usuarios.map(u =>
                    u.id === usuarioId ? { ...u, permissoes: novasPermissoes } : u
                ))
            }
        } catch (error) {
            console.error('Erro ao atualizar permissão:', error)
        } finally {
            setUsuarioEditando(null)
        }
    }

    const handleToggleAtivo = async (usuarioId: string, ativo: boolean) => {
        setUsuarioEditando(usuarioId)

        try {
            const res = await fetch(`/api/admin/usuarios/${usuarioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ativo })
            })

            if (res.ok) {
                setUsuarios(usuarios.map(u =>
                    u.id === usuarioId ? { ...u, ativo } : u
                ))
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
        } finally {
            setUsuarioEditando(null)
        }
    }

    const handleRemoverUsuario = async (usuarioId: string) => {
        if (!confirm('Tem certeza que deseja remover este usuário?')) return

        try {
            const res = await fetch(`/api/admin/usuarios/${usuarioId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                setUsuarios(usuarios.filter(u => u.id !== usuarioId))
                setMensagem({ tipo: 'sucesso', texto: 'Usuário removido com sucesso!' })
            } else {
                const error = await res.json()
                setMensagem({ tipo: 'erro', texto: error.error || 'Erro ao remover usuário' })
            }
        } catch {
            setMensagem({ tipo: 'erro', texto: 'Erro ao remover usuário' })
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'supremo':
                return <Badge className="bg-purple-500 hover:bg-purple-600">Supremo</Badge>
            case 'admin':
                return <Badge variant="secondary">Admin</Badge>
            case 'funcionario':
                return <Badge variant="outline">Funcionário</Badge>
            default:
                return <Badge variant="outline">{role}</Badge>
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Gerenciar Usuários
                    </CardTitle>
                    <CardDescription>Adicione usuários e controle suas permissões</CardDescription>
                </div>
                <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Novo Usuário
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                            <DialogDescription>
                                Crie uma conta para um novo membro da equipe
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome *</Label>
                                <Input
                                    id="nome"
                                    value={novoUsuario.nome}
                                    onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                                    placeholder="Nome do usuário"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={novoUsuario.email}
                                    onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="senha">Senha *</Label>
                                <Input
                                    id="senha"
                                    type="password"
                                    value={novoUsuario.senha}
                                    onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Nível de Acesso</Label>
                                <Select
                                    value={novoUsuario.role}
                                    onValueChange={(value) => setNovoUsuario({ ...novoUsuario, role: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="funcionario">Funcionário</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator />
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Permissões Iniciais</Label>
                                {PERMISSOES_CONFIG.map((perm) => (
                                    <div key={perm.key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <perm.icon className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{perm.label}</span>
                                        </div>
                                        <Switch
                                            checked={novoUsuario.permissoes[perm.key]}
                                            onCheckedChange={(checked) =>
                                                setNovoUsuario({
                                                    ...novoUsuario,
                                                    permissoes: { ...novoUsuario.permissoes, [perm.key]: checked }
                                                })
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogAberto(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleCriarUsuario} disabled={salvando}>
                                {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Usuário
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {mensagem && (
                    <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                        mensagem.tipo === 'sucesso'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {mensagem.tipo === 'sucesso' ? (
                            <CheckCircle className="h-4 w-4" />
                        ) : (
                            <XCircle className="h-4 w-4" />
                        )}
                        {mensagem.texto}
                    </div>
                )}

                {usuarios.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Nenhum usuário cadastrado além de você.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {usuarios.map((usuario) => (
                            <div
                                key={usuario.id}
                                className={`border rounded-lg p-4 ${
                                    !usuario.ativo ? 'opacity-60 bg-muted/50' : ''
                                } ${usuario.id === usuarioAtualId ? 'border-primary' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium">{usuario.nome}</h4>
                                            {getRoleBadge(usuario.role)}
                                            {usuario.id === usuarioAtualId && (
                                                <Badge variant="outline" className="text-xs">Você</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{usuario.email}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Criado em {format(new Date(usuario.createdAt), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                                            {usuario.ultimoLogin && (
                                                <> · Último acesso: {format(new Date(usuario.ultimoLogin), "d/MM/yy 'às' HH:mm", { locale: ptBR })}</>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {usuario.id !== usuarioAtualId && usuario.role !== 'supremo' && (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                    <Switch
                                                        checked={usuario.ativo}
                                                        onCheckedChange={(checked) => handleToggleAtivo(usuario.id, checked)}
                                                        disabled={usuarioEditando === usuario.id}
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleRemoverUsuario(usuario.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Permissões */}
                                {usuario.id !== usuarioAtualId && usuario.role !== 'supremo' && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                        {PERMISSOES_CONFIG.map((perm) => (
                                            <div
                                                key={perm.key}
                                                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50"
                                            >
                                                <perm.icon className={`h-4 w-4 ${
                                                    usuario.permissoes[perm.key] ? 'text-primary' : 'text-muted-foreground'
                                                }`} />
                                                <span className="text-xs text-center">{perm.label}</span>
                                                <Switch
                                                    checked={usuario.permissoes[perm.key]}
                                                    onCheckedChange={() => handleTogglePermissao(usuario.id, perm.key)}
                                                    disabled={usuarioEditando === usuario.id}
                                                    className="scale-75"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Usuário supremo - mostrar todas permissões como ativas */}
                                {usuario.role === 'supremo' && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Shield className="h-4 w-4" />
                                        Usuário supremo - Acesso total ao sistema
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
