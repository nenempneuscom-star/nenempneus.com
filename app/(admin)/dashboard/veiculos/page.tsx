'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, Car, Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'

interface VeiculoModelo {
    nome: string
    anosDisponiveis: number[]
    medidasPneu: string[]
}

interface VeiculoMarca {
    nome: string
    modelos: VeiculoModelo[]
}

export default function VeiculosPage() {
    const [veiculos, setVeiculos] = useState<VeiculoMarca[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState('')

    // Modal states
    const [modalMarcaAberto, setModalMarcaAberto] = useState(false)
    const [modalModeloAberto, setModalModeloAberto] = useState(false)
    const [modalEditarAberto, setModalEditarAberto] = useState(false)
    const [confirmDeleteAberto, setConfirmDeleteAberto] = useState(false)

    // Form states
    const [novaMarca, setNovaMarca] = useState('')
    const [marcaSelecionada, setMarcaSelecionada] = useState('')
    const [novoModelo, setNovoModelo] = useState('')
    const [anosInicio, setAnosInicio] = useState('2020')
    const [anosFim, setAnosFim] = useState('2026')
    const [medidasInput, setMedidasInput] = useState('')
    const [medidas, setMedidas] = useState<string[]>([])

    // Edit state
    const [editando, setEditando] = useState<{ marca: string; modelo: VeiculoModelo } | null>(null)

    // Delete state
    const [deletando, setDeletando] = useState<{ marca: string; modelo?: string } | null>(null)

    // Loading states
    const [salvando, setSalvando] = useState(false)

    // Carregar veículos
    useEffect(() => {
        carregarVeiculos()
    }, [])

    const carregarVeiculos = async () => {
        try {
            const res = await fetch('/api/veiculos/admin')
            const data = await res.json()
            if (data.success) {
                setVeiculos(data.veiculos)
            }
        } catch (error) {
            console.error('Erro ao carregar veículos:', error)
        } finally {
            setLoading(false)
        }
    }

    // Estatísticas
    const stats = useMemo(() => {
        let totalModelos = 0
        let totalCombinacoes = 0

        veiculos.forEach(marca => {
            totalModelos += marca.modelos.length
            marca.modelos.forEach(modelo => {
                totalCombinacoes += modelo.anosDisponiveis.length
            })
        })

        return {
            totalMarcas: veiculos.length,
            totalModelos,
            totalCombinacoes
        }
    }, [veiculos])

    // Filtrar marcas pela busca
    const marcasFiltradas = useMemo(() => {
        if (!busca) return veiculos

        const buscaLower = busca.toLowerCase()
        return veiculos.filter(marca =>
            marca.nome.toLowerCase().includes(buscaLower) ||
            marca.modelos.some(m => m.nome.toLowerCase().includes(buscaLower))
        )
    }, [busca, veiculos])

    // Gerar array de anos
    const gerarAnos = (inicio: number, fim: number): number[] => {
        const anos: number[] = []
        for (let ano = fim; ano >= inicio; ano--) {
            anos.push(ano)
        }
        return anos
    }

    // Adicionar medida
    const adicionarMedida = () => {
        const medidaFormatada = medidasInput.trim()
        if (!medidaFormatada) return

        // Validar formato: 175/70/14 ou 175/70R14
        const match = medidaFormatada.match(/^(\d{3})\/(\d{2})[R\/]?(\d{2})$/i)
        if (!match) {
            alert('Formato inválido. Use: 175/70/14 ou 175/70R14')
            return
        }

        const medidaPadronizada = `${match[1]}/${match[2]}/${match[3]}`
        if (!medidas.includes(medidaPadronizada)) {
            setMedidas([...medidas, medidaPadronizada])
        }
        setMedidasInput('')
    }

    // Remover medida
    const removerMedida = (medida: string) => {
        setMedidas(medidas.filter(m => m !== medida))
    }

    // Salvar nova marca
    const salvarMarca = async () => {
        if (!novaMarca.trim()) return

        setSalvando(true)
        try {
            const res = await fetch('/api/veiculos/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'addMarca',
                    marca: novaMarca.trim()
                })
            })

            const data = await res.json()
            if (data.success) {
                setVeiculos(data.veiculos)
                setModalMarcaAberto(false)
                setNovaMarca('')
            } else {
                alert(data.error || 'Erro ao salvar marca')
            }
        } catch (error) {
            alert('Erro ao salvar marca')
        } finally {
            setSalvando(false)
        }
    }

    // Salvar novo modelo
    const salvarModelo = async () => {
        if (!marcaSelecionada || !novoModelo.trim() || medidas.length === 0) {
            alert('Preencha todos os campos obrigatórios')
            return
        }

        const anos = gerarAnos(parseInt(anosInicio), parseInt(anosFim))

        setSalvando(true)
        try {
            const res = await fetch('/api/veiculos/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'addModelo',
                    marca: marcaSelecionada,
                    modelo: novoModelo.trim(),
                    anos,
                    medidas
                })
            })

            const data = await res.json()
            if (data.success) {
                setVeiculos(data.veiculos)
                setModalModeloAberto(false)
                resetFormModelo()
            } else {
                alert(data.error || 'Erro ao salvar modelo')
            }
        } catch (error) {
            alert('Erro ao salvar modelo')
        } finally {
            setSalvando(false)
        }
    }

    // Atualizar modelo existente
    const atualizarModelo = async () => {
        if (!editando || medidas.length === 0) return

        const anos = gerarAnos(parseInt(anosInicio), parseInt(anosFim))

        setSalvando(true)
        try {
            const res = await fetch('/api/veiculos/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateModelo',
                    marca: editando.marca,
                    modelo: editando.modelo.nome,
                    anos,
                    medidas
                })
            })

            const data = await res.json()
            if (data.success) {
                setVeiculos(data.veiculos)
                setModalEditarAberto(false)
                setEditando(null)
                resetFormModelo()
            } else {
                alert(data.error || 'Erro ao atualizar modelo')
            }
        } catch (error) {
            alert('Erro ao atualizar modelo')
        } finally {
            setSalvando(false)
        }
    }

    // Deletar marca ou modelo
    const confirmarDelete = async () => {
        if (!deletando) return

        setSalvando(true)
        try {
            const params = new URLSearchParams({ marca: deletando.marca })
            if (deletando.modelo) {
                params.append('modelo', deletando.modelo)
            }

            const res = await fetch(`/api/veiculos/admin?${params.toString()}`, {
                method: 'DELETE'
            })

            const data = await res.json()
            if (data.success) {
                setVeiculos(data.veiculos)
                setConfirmDeleteAberto(false)
                setDeletando(null)
            } else {
                alert(data.error || 'Erro ao deletar')
            }
        } catch (error) {
            alert('Erro ao deletar')
        } finally {
            setSalvando(false)
        }
    }

    // Abrir modal de edição
    const abrirEdicao = (marca: string, modelo: VeiculoModelo) => {
        setEditando({ marca, modelo })
        setAnosInicio(String(Math.min(...modelo.anosDisponiveis)))
        setAnosFim(String(Math.max(...modelo.anosDisponiveis)))
        setMedidas([...modelo.medidasPneu])
        setModalEditarAberto(true)
    }

    // Reset form modelo
    const resetFormModelo = () => {
        setNovoModelo('')
        setMarcaSelecionada('')
        setAnosInicio('2020')
        setAnosFim('2026')
        setMedidas([])
        setMedidasInput('')
    }

    // Gerar anos para select
    const anosOptions = useMemo(() => {
        const anos = []
        for (let ano = 2030; ano >= 1950; ano--) {
            anos.push(ano)
        }
        return anos
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Veículos Compatíveis</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie a base de dados de veículos e medidas de pneus
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setModalMarcaAberto(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Marca
                    </Button>
                    <Button variant="outline" onClick={() => setModalModeloAberto(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Modelo
                    </Button>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.totalMarcas}</div>
                        <p className="text-sm text-muted-foreground">Marcas cadastradas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.totalModelos}</div>
                        <p className="text-sm text-muted-foreground">Modelos de veículos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.totalCombinacoes.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">Combinações marca/modelo/ano</p>
                    </CardContent>
                </Card>
            </div>

            {/* Busca */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        Buscar Veículos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por marca ou modelo..."
                            className="pl-9"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Marcas e Modelos */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {marcasFiltradas.length} marca(s) encontrada(s)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {marcasFiltradas.map((marca) => (
                            <AccordionItem key={marca.nome} value={marca.nome}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="font-semibold">{marca.nome}</span>
                                        <Badge variant="secondary">
                                            {marca.modelos.length} modelo(s)
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 pt-2">
                                        {/* Botão deletar marca */}
                                        <div className="flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => {
                                                    setDeletando({ marca: marca.nome })
                                                    setConfirmDeleteAberto(true)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Excluir marca
                                            </Button>
                                        </div>

                                        {marca.modelos.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Nenhum modelo cadastrado
                                            </p>
                                        ) : (
                                            marca.modelos.map((modelo) => (
                                                <div
                                                    key={modelo.nome}
                                                    className="border rounded-lg p-4 space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium">{modelo.nome}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-muted-foreground">
                                                                {Math.min(...modelo.anosDisponiveis)} - {Math.max(...modelo.anosDisponiveis)}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => abrirEdicao(marca.nome, modelo)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                onClick={() => {
                                                                    setDeletando({ marca: marca.nome, modelo: modelo.nome })
                                                                    setConfirmDeleteAberto(true)
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            Medidas de pneus compatíveis:
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {modelo.medidasPneu.map((medida) => {
                                                                const [largura, perfil, aro] = medida.split('/')
                                                                return (
                                                                    <Badge key={medida} variant="outline">
                                                                        {largura}/{perfil}R{aro}
                                                                    </Badge>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            Anos disponíveis ({modelo.anosDisponiveis.length}):
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {modelo.anosDisponiveis.slice().sort((a, b) => a - b).join(', ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            {/* Modal Nova Marca */}
            <Dialog open={modalMarcaAberto} onOpenChange={setModalMarcaAberto}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Nova Marca</DialogTitle>
                        <DialogDescription>
                            Adicione uma nova marca de veículo à base de dados
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="novaMarca">Nome da Marca</Label>
                            <Input
                                id="novaMarca"
                                placeholder="Ex: Toyota, Honda, Fiat..."
                                value={novaMarca}
                                onChange={(e) => setNovaMarca(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalMarcaAberto(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={salvarMarca} disabled={salvando || !novaMarca.trim()}>
                            {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Novo Modelo */}
            <Dialog open={modalModeloAberto} onOpenChange={(open) => {
                setModalModeloAberto(open)
                if (!open) resetFormModelo()
            }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Modelo</DialogTitle>
                        <DialogDescription>
                            Adicione um novo modelo de veículo com suas medidas de pneus compatíveis
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Marca */}
                        <div className="space-y-2">
                            <Label>Marca</Label>
                            <Select value={marcaSelecionada} onValueChange={setMarcaSelecionada}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a marca" />
                                </SelectTrigger>
                                <SelectContent>
                                    {veiculos.map((marca) => (
                                        <SelectItem key={marca.nome} value={marca.nome}>
                                            {marca.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Nome do Modelo */}
                        <div className="space-y-2">
                            <Label htmlFor="novoModelo">Nome do Modelo</Label>
                            <Input
                                id="novoModelo"
                                placeholder="Ex: Corolla, Civic, Uno..."
                                value={novoModelo}
                                onChange={(e) => setNovoModelo(e.target.value)}
                            />
                        </div>

                        {/* Anos */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ano Inicial</Label>
                                <Select value={anosInicio} onValueChange={setAnosInicio}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {anosOptions.map((ano) => (
                                            <SelectItem key={ano} value={String(ano)}>
                                                {ano}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Ano Final</Label>
                                <Select value={anosFim} onValueChange={setAnosFim}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {anosOptions.map((ano) => (
                                            <SelectItem key={ano} value={String(ano)}>
                                                {ano}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Medidas */}
                        <div className="space-y-2">
                            <Label>Medidas de Pneus Compatíveis</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ex: 175/70/14"
                                    value={medidasInput}
                                    onChange={(e) => setMedidasInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            adicionarMedida()
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" onClick={adicionarMedida}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {medidas.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {medidas.map((medida) => {
                                        const [largura, perfil, aro] = medida.split('/')
                                        return (
                                            <Badge key={medida} variant="secondary" className="flex items-center gap-1">
                                                {largura}/{perfil}R{aro}
                                                <button
                                                    onClick={() => removerMedida(medida)}
                                                    className="ml-1 hover:text-destructive"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalModeloAberto(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={salvarModelo}
                            disabled={salvando || !marcaSelecionada || !novoModelo.trim() || medidas.length === 0}
                        >
                            {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Editar Modelo */}
            <Dialog open={modalEditarAberto} onOpenChange={(open) => {
                setModalEditarAberto(open)
                if (!open) {
                    setEditando(null)
                    resetFormModelo()
                }
            }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Modelo</DialogTitle>
                        <DialogDescription>
                            {editando && `${editando.marca} ${editando.modelo.nome}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Anos */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ano Inicial</Label>
                                <Select value={anosInicio} onValueChange={setAnosInicio}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {anosOptions.map((ano) => (
                                            <SelectItem key={ano} value={String(ano)}>
                                                {ano}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Ano Final</Label>
                                <Select value={anosFim} onValueChange={setAnosFim}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {anosOptions.map((ano) => (
                                            <SelectItem key={ano} value={String(ano)}>
                                                {ano}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Medidas */}
                        <div className="space-y-2">
                            <Label>Medidas de Pneus Compatíveis</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ex: 175/70/14"
                                    value={medidasInput}
                                    onChange={(e) => setMedidasInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            adicionarMedida()
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" onClick={adicionarMedida}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {medidas.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {medidas.map((medida) => {
                                        const [largura, perfil, aro] = medida.split('/')
                                        return (
                                            <Badge key={medida} variant="secondary" className="flex items-center gap-1">
                                                {largura}/{perfil}R{aro}
                                                <button
                                                    onClick={() => removerMedida(medida)}
                                                    className="ml-1 hover:text-destructive"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalEditarAberto(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={atualizarModelo}
                            disabled={salvando || medidas.length === 0}
                        >
                            {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmação de Delete */}
            <AlertDialog open={confirmDeleteAberto} onOpenChange={setConfirmDeleteAberto}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deletando?.modelo
                                ? `Tem certeza que deseja excluir o modelo "${deletando.modelo}" da marca ${deletando.marca}?`
                                : `Tem certeza que deseja excluir a marca "${deletando?.marca}" e todos os seus modelos?`
                            }
                            <br />
                            <span className="text-destructive font-medium">Esta ação não pode ser desfeita.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmarDelete}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={salvando}
                        >
                            {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
