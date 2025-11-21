'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search } from 'lucide-react'

export function BuscaVeiculo() {
    const [marca, setMarca] = useState('')
    const [modelo, setModelo] = useState('')
    const [ano, setAno] = useState('')

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
                    <div className="space-y-2">
                        <Label>Marca</Label>
                        <Input
                            placeholder="Ex: Volkswagen"
                            value={marca}
                            onChange={(e) => setMarca(e.target.value)}
                        />
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
