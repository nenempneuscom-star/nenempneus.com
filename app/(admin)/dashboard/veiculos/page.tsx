'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { Search, Car, ChevronRight, Info } from 'lucide-react'
import { VEICULOS_BRASIL, getMarcas } from '@/lib/data/veiculos-brasil'

export default function VeiculosPage() {
    const [busca, setBusca] = useState('')
    const [marcaSelecionada, setMarcaSelecionada] = useState<string | null>(null)

    const marcas = getMarcas()

    // Estatísticas
    const stats = useMemo(() => {
        let totalModelos = 0
        let totalCombinacoes = 0

        VEICULOS_BRASIL.forEach(marca => {
            totalModelos += marca.modelos.length
            marca.modelos.forEach(modelo => {
                totalCombinacoes += modelo.anosDisponiveis.length
            })
        })

        return {
            totalMarcas: VEICULOS_BRASIL.length,
            totalModelos,
            totalCombinacoes
        }
    }, [])

    // Filtrar marcas pela busca
    const marcasFiltradas = useMemo(() => {
        if (!busca) return VEICULOS_BRASIL

        const buscaLower = busca.toLowerCase()
        return VEICULOS_BRASIL.filter(marca =>
            marca.nome.toLowerCase().includes(buscaLower) ||
            marca.modelos.some(m => m.nome.toLowerCase().includes(buscaLower))
        )
    }, [busca])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Veículos Compatíveis</h1>
                <p className="text-muted-foreground mt-1">
                    Base de dados de veículos e medidas de pneus compatíveis
                </p>
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

            {/* Info */}
            <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-700 dark:text-blue-300">
                                Base de dados estática
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Esta base de dados está armazenada no código. Para adicionar novos veículos ou
                                medidas, edite o arquivo <code className="text-xs bg-muted px-1 py-0.5 rounded">lib/data/veiculos-brasil.ts</code>.
                                Em uma versão futura, esses dados podem ser migrados para o banco de dados
                                para edição via admin.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold">{marca.nome}</span>
                                        <Badge variant="secondary">
                                            {marca.modelos.length} modelo(s)
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 pt-2">
                                        {marca.modelos.map((modelo) => (
                                            <div
                                                key={modelo.nome}
                                                className="border rounded-lg p-4 space-y-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium">{modelo.nome}</h4>
                                                    <span className="text-sm text-muted-foreground">
                                                        {modelo.anosDisponiveis[modelo.anosDisponiveis.length - 1]} - {modelo.anosDisponiveis[0]}
                                                    </span>
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
                                                        {modelo.anosDisponiveis.slice().reverse().join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    )
}
