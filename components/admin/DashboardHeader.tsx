'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function getSaudacao(): string {
    // Usar fuso horário de São Paulo (Brasil)
    const agora = new Date()
    const agoraBrasil = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const hora = agoraBrasil.getHours()

    if (hora >= 0 && hora < 6) {
        return 'Boa madrugada'
    } else if (hora >= 6 && hora < 12) {
        return 'Bom dia'
    } else if (hora >= 12 && hora < 18) {
        return 'Boa tarde'
    } else {
        return 'Boa noite'
    }
}

export function DashboardHeader() {
    const [date, setDate] = useState<string>('')
    const [saudacao, setSaudacao] = useState<string>('Olá')

    useEffect(() => {
        setDate(format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }))
        setSaudacao(getSaudacao())
    }, [])

    return (
        <div className="flex flex-col gap-1 mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {saudacao}, Admin! 👋
            </h1>
            <p className="text-muted-foreground capitalize">
                {date}
            </p>
        </div>
    )
}
