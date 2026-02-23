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
    aros: string[]
    aroLarguras: Record<string, string[]>
    larguraPerfis: Record<string, string[]>
}

export function BuscaMedidas() {
    const router = useRouter()
    const [medidas, setMedidas] = useState<MedidasData | null>(null)
    const [loading, setLoading] = useState(true)

    const [aro, setAro] = useState<string>('')
    const [largura, setLargura] = useState<string>('')
    const [perfil, setPerfil] = useState<string>('')

    const [largurasDisponiveis, setLargurasDisponiveis] = useState<string[]>([])
    const [perfisDisponiveis, setPerfisDisponiveis] = useState<string[]>([])

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

    // Quando aro muda, atualizar larguras disponíveis
    useEffect(() => {
        if (medidas && aro) {
            const larguras = medidas.aroLarguras[aro] || []
            setLargurasDisponiveis(larguras)
            setLargura('')
            setPerfil('')
            setPerfisDisponiveis([])
        }
    }, [aro, medidas])

    // Quando largura muda, atualizar perfis disponíveis
    useEffect(() => {
        if (medidas && aro && largura) {
            const key = `${aro}-${largura}`
            const perfis = medidas.larguraPerfis[key] || []
            setPerfisDisponiveis(perfis)
            setPerfil('')
        }
    }, [largura, aro, medidas])

    const handlePesquisar = () => {
        const params = new URLSearchParams()
        if (largura) params.set('largura', largura)
        if (perfil) params.set('perfil', perfil)
        if (aro) params.set('aro', aro)
        router.push(`/catalogo?${params.toString()}`)
    }

    const canSearch = aro && largura && perfil

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

    if (!medidas || medidas.aros.length === 0) {
        return null
    }

    return (
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-3xl mx-auto">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Pesquise pelas medidas
            </span>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                <Select value={aro} onValueChange={setAro}>
                    <SelectTrigger className="w-24 sm:w-28 bg-background">
                        <SelectValue placeholder="Aro" />
                    </SelectTrigger>
                    <SelectContent>
                        {medidas.aros.map((a) => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={largura} onValueChange={setLargura} disabled={!aro}>
                    <SelectTrigger className="w-24 sm:w-28 bg-background">
                        <SelectValue placeholder="Largura" />
                    </SelectTrigger>
                    <SelectContent>
                        {largurasDisponiveis.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={perfil} onValueChange={setPerfil} disabled={!largura}>
                    <SelectTrigger className="w-24 sm:w-28 bg-background">
                        <SelectValue placeholder="Perfil" />
                    </SelectTrigger>
                    <SelectContent>
                        {perfisDisponiveis.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
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
