'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Filter, X } from 'lucide-react'

interface FiltrosCatalogoProps {
    marcas: string[]
    aros: string[]
    onFiltrar: (filtros: any) => void
}

export function FiltrosCatalogo({ marcas, aros, onFiltrar }: FiltrosCatalogoProps) {
    const [marca, setMarca] = useState<string>('')
    const [aro, setAro] = useState<string>('')
    const [precoMin, setPrecoMin] = useState<string>('')
    const [precoMax, setPrecoMax] = useState<string>('')

    const handleFiltrar = () => {
        onFiltrar({
            marca: marca || undefined,
            aro: aro || undefined,
            precoMin: precoMin ? parseFloat(precoMin) : undefined,
            precoMax: precoMax ? parseFloat(precoMax) : undefined,
        })
    }

    const handleLimpar = () => {
        setMarca('')
        setAro('')
        setPrecoMin('')
        setPrecoMax('')
        onFiltrar({})
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Marca */}
                <div className="space-y-2">
                    <Label>Marca</Label>
                    <Select value={marca} onValueChange={setMarca}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todas as marcas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as marcas</SelectItem>
                            {marcas.map((m) => (
                                <SelectItem key={m} value={m}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Aro */}
                <div className="space-y-2">
                    <Label>Aro</Label>
                    <Select value={aro} onValueChange={setAro}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todos os aros" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os aros</SelectItem>
                            {aros.map((a) => (
                                <SelectItem key={a} value={a}>
                                    Aro {a}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Preço */}
                <div className="space-y-2">
                    <Label>Faixa de Preço</Label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            value={precoMin}
                            onChange={(e) => setPrecoMin(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            value={precoMax}
                            onChange={(e) => setPrecoMax(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>
                </div>

                {/* Botões */}
                <div className="space-y-2 pt-4">
                    <Button onClick={handleFiltrar} className="w-full">
                        Aplicar Filtros
                    </Button>
                    <Button onClick={handleLimpar} variant="outline" className="w-full">
                        <X className="h-4 w-4 mr-2" />
                        Limpar Filtros
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
