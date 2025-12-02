'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, ChevronDown, Car, Loader2 } from 'lucide-react'
import {
    getMarcas,
    getModelosByMarca,
    getAnosByMarcaModelo,
    getMedidasPneu
} from '@/lib/data/veiculos-brasil'

interface ComboboxProps {
    label: string
    value: string
    onChange: (value: string) => void
    options: string[]
    placeholder: string
    disabled?: boolean
    loading?: boolean
}

// Componente Combobox reutilizável (permite digitar OU selecionar)
function Combobox({ label, value, onChange, options, placeholder, disabled, loading }: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value)
    const [filteredOptions, setFilteredOptions] = useState(options)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Atualizar inputValue quando value muda externamente
    useEffect(() => {
        setInputValue(value)
    }, [value])

    // Filtrar opções quando digita
    useEffect(() => {
        if (inputValue) {
            const filtered = options.filter(opt =>
                opt.toLowerCase().includes(inputValue.toLowerCase())
            )
            setFilteredOptions(filtered)
        } else {
            setFilteredOptions(options)
        }
    }, [inputValue, options])

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
                // Se o valor digitado não está nas opções, limpar
                if (inputValue && !options.some(opt => opt.toLowerCase() === inputValue.toLowerCase())) {
                    // Tenta encontrar uma opção que começa com o que foi digitado
                    const match = options.find(opt => opt.toLowerCase().startsWith(inputValue.toLowerCase()))
                    if (match) {
                        setInputValue(match)
                        onChange(match)
                    }
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [inputValue, options, onChange])

    const handleSelect = (option: string) => {
        setInputValue(option)
        onChange(option)
        setIsOpen(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setInputValue(newValue)
        setIsOpen(true)

        // Se encontrar uma correspondência exata, selecionar
        const exactMatch = options.find(opt => opt.toLowerCase() === newValue.toLowerCase())
        if (exactMatch) {
            onChange(exactMatch)
        } else {
            // Limpar seleção se não for correspondência exata
            if (value) {
                onChange('')
            }
        }
    }

    const handleInputFocus = () => {
        setIsOpen(true)
        setFilteredOptions(options)
    }

    return (
        <div className="space-y-2 relative" ref={containerRef}>
            <Label>{label}</Label>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    disabled={disabled || loading}
                    autoComplete="off"
                />
                <button
                    type="button"
                    className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                    onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
                    disabled={disabled || loading}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                </button>
            </div>

            {isOpen && filteredOptions.length > 0 && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.map((option) => (
                        <button
                            key={option}
                            type="button"
                            className={`w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm ${option === value ? 'bg-muted font-medium' : ''
                                }`}
                            onClick={() => handleSelect(option)}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}

            {isOpen && filteredOptions.length === 0 && inputValue && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
                    Nenhuma opção encontrada
                </div>
            )}
        </div>
    )
}

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
                    <Combobox
                        label="Marca"
                        value={marca}
                        onChange={setMarca}
                        options={marcas}
                        placeholder="Selecione a marca"
                    />

                    <Combobox
                        label="Modelo"
                        value={modelo}
                        onChange={setModelo}
                        options={modelos}
                        placeholder={marca ? "Selecione o modelo" : "Primeiro selecione a marca"}
                        disabled={!marca}
                    />

                    <Combobox
                        label="Ano"
                        value={ano}
                        onChange={setAno}
                        options={anos}
                        placeholder={modelo ? "Selecione o ano" : "Primeiro selecione o modelo"}
                        disabled={!modelo}
                    />
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
