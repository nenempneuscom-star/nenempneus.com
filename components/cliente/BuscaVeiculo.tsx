'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search } from 'lucide-react'

// Lista de marcas de veículos populares no Brasil
const MARCAS_VEICULOS = [
    'Chevrolet',
    'Fiat',
    'Ford',
    'Honda',
    'Hyundai',
    'Jeep',
    'Kia',
    'Mercedes-Benz',
    'Mitsubishi',
    'Nissan',
    'Peugeot',
    'Renault',
    'Toyota',
    'Volkswagen',
    'BMW',
    'Audi',
    'Citroën',
    'Chery',
    'Caoa Chery',
    'JAC',
    'Suzuki',
    'Subaru',
    'Volvo',
    'Land Rover',
    'Porsche',
    'Mini',
    'RAM',
    'Dodge',
    'Chrysler',
    'Lifan',
    'BYD',
    'GWM',
    'Haval'
].sort()

export function BuscaVeiculo() {
    const [marca, setMarca] = useState('')
    const [modelo, setModelo] = useState('')
    const [ano, setAno] = useState('')
    const [showSugestoes, setShowSugestoes] = useState(false)
    const [sugestoesFiltradas, setSugestoesFiltradas] = useState<string[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const sugestoesRef = useRef<HTMLDivElement>(null)

    // Filtrar sugestões quando digita
    useEffect(() => {
        if (marca.length > 0) {
            const filtradas = MARCAS_VEICULOS.filter(m =>
                m.toLowerCase().includes(marca.toLowerCase())
            )
            setSugestoesFiltradas(filtradas)
            setShowSugestoes(filtradas.length > 0)
        } else {
            setSugestoesFiltradas(MARCAS_VEICULOS)
            setShowSugestoes(false)
        }
    }, [marca])

    // Fechar sugestões ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                sugestoesRef.current &&
                !sugestoesRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSugestoes(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelecionarMarca = (marcaSelecionada: string) => {
        setMarca(marcaSelecionada)
        setShowSugestoes(false)
    }

    const handleBuscar = () => {
        // Por enquanto só console.log, implementar depois
        console.log('Buscar por veículo:', { marca, modelo, ano })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Buscar por Veículo
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 relative">
                        <Label>Marca</Label>
                        <Input
                            ref={inputRef}
                            placeholder="Ex: Volkswagen"
                            value={marca}
                            onChange={(e) => setMarca(e.target.value)}
                            onFocus={() => {
                                if (marca.length === 0) {
                                    setSugestoesFiltradas(MARCAS_VEICULOS)
                                }
                                setShowSugestoes(true)
                            }}
                            autoComplete="off"
                        />
                        {showSugestoes && sugestoesFiltradas.length > 0 && (
                            <div
                                ref={sugestoesRef}
                                className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
                            >
                                {sugestoesFiltradas.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm"
                                        onClick={() => handleSelecionarMarca(m)}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Modelo</Label>
                        <Input
                            placeholder="Ex: Gol"
                            value={modelo}
                            onChange={(e) => setModelo(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Ano</Label>
                        <Input
                            type="number"
                            placeholder="Ex: 2018"
                            value={ano}
                            onChange={(e) => setAno(e.target.value)}
                        />
                    </div>
                </div>
                <Button onClick={handleBuscar} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Pneus
                </Button>
            </CardContent>
        </Card>
    )
}
