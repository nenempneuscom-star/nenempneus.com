'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

interface MedidasData {
    larguras: string[]
    larguraPerfis: Record<string, string[]>
    perfilAros: Record<string, string[]>
}

export function BuscaMedidas() {
    const router = useRouter()
    const [medidas, setMedidas] = useState<MedidasData | null>(null)
    const [loading, setLoading] = useState(true)

    const [largura, setLargura] = useState<string>('')
    const [perfil, setPerfil] = useState<string>('')
    const [aro, setAro] = useState<string>('')

    const [perfisDisponiveis, setPerfisDisponiveis] = useState<string[]>([])
    const [arosDisponiveis, setArosDisponiveis] = useState<string[]>([])

    useEffect(() => {
        async function fetchMedidas() {
            try {
                const res = await fetch('/api/medidas')
                const data = await res.json()
                setMedidas(data)
            } catch (error) {
                console.error('Erro ao carregar medidas:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchMedidas()
    }, [])

    // Quando largura muda, atualizar perfis disponíveis
    useEffect(() => {
        if (medidas && largura) {
            const perfis = medidas.larguraPerfis[largura] || []
            setPerfisDisponiveis(perfis)
            setPerfil('')
            setAro('')
            setArosDisponiveis([])
        }
    }, [largura, medidas])

    // Quando perfil muda, atualizar aros disponíveis
    useEffect(() => {
        if (medidas && largura && perfil) {
            const key = `${largura}-${perfil}`
            const aros = medidas.perfilAros[key] || []
            setArosDisponiveis(aros)
            setAro('')
        }
    }, [perfil, largura, medidas])

    const handlePesquisar = () => {
        const params = new URLSearchParams()
        if (largura) params.set('largura', largura)
        if (perfil) params.set('perfil', perfil)
        if (aro) params.set('aro', aro)
        router.push(`/catalogo?${params.toString()}`)
    }

    const canSearch = largura && perfil && aro

    if (loading) {
        return (
            <div className="flex items-center gap-4 flex-wrap justify-center">
                <div className="h-10 w-28 bg-muted animate-pulse rounded-md" />
                <div className="h-10 w-28 bg-muted animate-pulse rounded-md" />
                <div className="h-10 w-28 bg-muted animate-pulse rounded-md" />
                <div className="h-10 w-28 bg-muted animate-pulse rounded-md" />
            </div>
        )
    }

    if (!medidas || medidas.larguras.length === 0) {
        return null
    }

    return (
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-3xl mx-auto">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Pesquise pelas medidas
            </span>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                <Select value={largura} onValueChange={setLargura}>
                    <SelectTrigger className="w-24 sm:w-28 bg-background">
                        <SelectValue placeholder="Largura" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="" disabled>Largura</SelectItem>
                        {medidas.larguras.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={perfil} onValueChange={setPerfil} disabled={!largura}>
                    <SelectTrigger className="w-24 sm:w-28 bg-background">
                        <SelectValue placeholder="Perfil" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="" disabled>Perfil</SelectItem>
                        {perfisDisponiveis.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={aro} onValueChange={setAro} disabled={!perfil}>
                    <SelectTrigger className="w-24 sm:w-28 bg-background">
                        <SelectValue placeholder="Aro" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="" disabled>Aro</SelectItem>
                        {arosDisponiveis.map((a) => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    onClick={handlePesquisar}
                    disabled={!canSearch}
                    className="px-6"
                >
                    <Search className="h-4 w-4 mr-2" />
                    Pesquisar
                </Button>
            </div>
        </div>
    )
}
