'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, Car, Loader2 } from 'lucide-react'
import {
    getMarcas,
    getModelosByMarca,
    getAnosByMarcaModelo,
    getMedidasPneu
} from '@/lib/data/veiculos-brasil'

interface BuscaVeiculoProps {
    onBuscar?: (medidas: string[]) => void
}

export function BuscaVeiculo({ onBuscar }: BuscaVeiculoProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [marca, setMarca] = useState('')
    const [modelo, setModelo] = useState('')
    const [ano, setAno] = useState('')
    const [buscando, setBuscando] = useState(false)
    const [medidasEncontradas, setMedidasEncontradas] = useState<string[]>([])

    // Listas de opções
    const marcas = getMarcas()
    const [modelos, setModelos] = useState<string[]>([])
    const [anos, setAnos] = useState<string[]>([])

    // Atualizar modelos quando marca muda
    useEffect(() => {
        if (marca) {
            const modelosList = getModelosByMarca(marca)
            setModelos(modelosList)
        } else {
            setModelos([])
        }
        // Limpar modelo e ano quando marca muda
        setModelo('')
        setAno('')
        setMedidasEncontradas([])
    }, [marca])

    // Atualizar anos quando modelo muda
    useEffect(() => {
        if (marca && modelo) {
            const anosList = getAnosByMarcaModelo(marca, modelo)
            setAnos(anosList.map(String))
        } else {
            setAnos([])
        }
        // Limpar ano quando modelo muda
        setAno('')
        setMedidasEncontradas([])
    }, [marca, modelo])

    // Buscar medidas quando ano é selecionado
    useEffect(() => {
        if (marca && modelo && ano) {
            const medidas = getMedidasPneu(marca, modelo, Number(ano))
            setMedidasEncontradas(medidas)
        } else if (marca && modelo) {
            // Se não selecionou ano, mostra todas as medidas do modelo
            const medidas = getMedidasPneu(marca, modelo)
            setMedidasEncontradas(medidas)
        } else {
            setMedidasEncontradas([])
        }
    }, [marca, modelo, ano])

    const handleBuscar = useCallback(async () => {
        if (medidasEncontradas.length === 0) return

        setBuscando(true)

        try {
            // Callback opcional para integração externa
            if (onBuscar) {
                onBuscar(medidasEncontradas)
            }

            // Redirecionar para página de produtos com filtro de medidas
            const params = new URLSearchParams(searchParams.toString())
            params.set('medidas', medidasEncontradas.join(','))
            params.set('veiculo', `${marca} ${modelo}${ano ? ` ${ano}` : ''}`)

            router.push(`/catalogo?${params.toString()}`)
        } finally {
            setBuscando(false)
        }
    }, [medidasEncontradas, marca, modelo, ano, onBuscar, router, searchParams])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Buscar por Veículo
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Não sabe a medida do pneu? Informe seu veículo que encontramos para você!
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Marca */}
                    <div className="space-y-2">
                        <Label>Marca</Label>
                        <Select value={marca} onValueChange={setMarca}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a marca" />
                            </SelectTrigger>
                            <SelectContent>
                                {marcas.map((m) => (
                                    <SelectItem key={m} value={m}>
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Modelo */}
                    <div className="space-y-2">
                        <Label>Modelo</Label>
                        <Select
                            value={modelo}
                            onValueChange={setModelo}
                            disabled={!marca}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={marca ? "Selecione o modelo" : "Primeiro selecione a marca"} />
                            </SelectTrigger>
                            <SelectContent>
                                {modelos.map((m) => (
                                    <SelectItem key={m} value={m}>
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ano */}
                    <div className="space-y-2">
                        <Label>Ano</Label>
                        <Select
                            value={ano}
                            onValueChange={setAno}
                            disabled={!modelo}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={modelo ? "Selecione o ano" : "Primeiro selecione o modelo"} />
                            </SelectTrigger>
                            <SelectContent>
                                {anos.map((a) => (
                                    <SelectItem key={a} value={a}>
                                        {a}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Medidas encontradas */}
                {medidasEncontradas.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <p className="text-sm font-medium">
                            Medidas compatíveis com {marca} {modelo}{ano ? ` ${ano}` : ''}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {medidasEncontradas.map((medida) => {
                                const [largura, perfil, aro] = medida.split('/')
                                return (
                                    <span
                                        key={medida}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                                    >
                                        {largura}/{perfil}R{aro}
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                )}

                <Button
                    onClick={handleBuscar}
                    className="w-full"
                    disabled={medidasEncontradas.length === 0 || buscando}
                >
                    {buscando ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Buscando...
                        </>
                    ) : (
                        <>
                            <Search className="h-4 w-4 mr-2" />
                            {medidasEncontradas.length > 0
                                ? `Buscar Pneus (${medidasEncontradas.length} medida${medidasEncontradas.length > 1 ? 's' : ''})`
                                : 'Selecione o veículo para buscar'
                            }
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
