import { addDays, format, parse, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { db } from './db'
import { LOJA_SLUG } from './constants'

export interface SlotHorario {
    hora: string
    disponivel: boolean
    vagas: number
}

export async function getSettings() {
    const loja = await db.loja.findUnique({
        where: { slug: LOJA_SLUG },
        include: { settings: true },
    })

    if (!loja?.settings) {
        throw new Error('Settings não encontradas')
    }

    return loja.settings
}

export function gerarHorarios(
    inicio: string,
    fim: string,
    intervalo: number
): string[] {
    const horarios: string[] = []

    const [horaInicio, minutoInicio] = inicio.split(':').map(Number)
    const [horaFim, minutoFim] = fim.split(':').map(Number)

    let horaAtual = horaInicio
    let minutoAtual = minutoInicio

    while (
        horaAtual < horaFim ||
        (horaAtual === horaFim && minutoAtual < minutoFim)
    ) {
        horarios.push(
            `${String(horaAtual).padStart(2, '0')}:${String(minutoAtual).padStart(2, '0')}`
        )

        minutoAtual += intervalo
        if (minutoAtual >= 60) {
            horaAtual += Math.floor(minutoAtual / 60)
            minutoAtual = minutoAtual % 60
        }
    }

    return horarios
}

export async function verificarDisponibilidade(
    data: Date,
    hora: string
): Promise<boolean> {
    const settings = await getSettings()
    const loja = await db.loja.findUnique({
        where: { slug: LOJA_SLUG },
    })

    if (!loja) return false

    // Contar agendamentos no mesmo horário
    const agendamentos = await db.agendamento.count({
        where: {
            lojaId: loja.id,
            data: data,
            hora: new Date(`1970-01-01T${hora}:00`),
            status: {
                in: ['confirmado', 'em_andamento'],
            },
        },
    })

    return agendamentos < settings.clientesPorSlot
}

export async function getSlotsDisponiveis(data: Date): Promise<SlotHorario[]> {
    const settings = await getSettings()
    const loja = await db.loja.findUnique({
        where: { slug: LOJA_SLUG },
    })

    if (!loja) return []

    // Gerar horários do dia
    const horarios = gerarHorarios(
        format(settings.horarioInicio, 'HH:mm'),
        format(settings.horarioFim, 'HH:mm'),
        settings.intervaloSlots
    )

    // Buscar agendamentos do dia
    const agendamentos = await db.agendamento.findMany({
        where: {
            lojaId: loja.id,
            data: data,
            status: {
                in: ['confirmado', 'em_andamento'],
            },
        },
    })

    // Mapear disponibilidade
    return horarios.map((hora) => {
        const agendamentosNaHora = agendamentos.filter(
            (a) => format(a.hora, 'HH:mm') === hora
        ).length

        const vagas = settings.clientesPorSlot - agendamentosNaHora

        return {
            hora,
            disponivel: vagas > 0,
            vagas,
        }
    })
}
