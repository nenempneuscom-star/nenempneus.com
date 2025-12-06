import { format, isSameDay } from 'date-fns'
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
    intervalo: number,
    intervaloAlmoco?: { ativo: boolean; inicio: string; fim: string }
): string[] {
    const horarios: string[] = []

    const [horaInicio, minutoInicio] = inicio.split(':').map(Number)
    const [horaFim, minutoFim] = fim.split(':').map(Number)

    // Converter intervalo de almoço para minutos
    let intervaloInicioMinutos = 0
    let intervaloFimMinutos = 0
    if (intervaloAlmoco?.ativo && intervaloAlmoco.inicio && intervaloAlmoco.fim) {
        const [hi, mi] = intervaloAlmoco.inicio.split(':').map(Number)
        const [hf, mf] = intervaloAlmoco.fim.split(':').map(Number)
        intervaloInicioMinutos = hi * 60 + mi
        intervaloFimMinutos = hf * 60 + mf
    }

    let horaAtual = horaInicio
    let minutoAtual = minutoInicio

    while (
        horaAtual < horaFim ||
        (horaAtual === horaFim && minutoAtual < minutoFim)
    ) {
        const horarioAtualMinutos = horaAtual * 60 + minutoAtual

        // Verificar se está dentro do intervalo de almoço
        const dentroIntervalo = intervaloAlmoco?.ativo &&
            horarioAtualMinutos >= intervaloInicioMinutos &&
            horarioAtualMinutos < intervaloFimMinutos

        if (!dentroIntervalo) {
            horarios.push(
                `${String(horaAtual).padStart(2, '0')}:${String(minutoAtual).padStart(2, '0')}`
            )
        }

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

    // Verificar se o dia da semana está nos dias de funcionamento
    const diaSemana = data.getDay() // 0 = domingo, 1 = segunda, etc
    const diasFuncionamento = settings.diasFuncionamento as number[] || [1, 2, 3, 4, 5, 6]
    if (!diasFuncionamento.includes(diaSemana)) {
        return [] // Loja fechada neste dia
    }

    // Obter horário do dia (específico ou padrão)
    const horariosPorDia = settings.horariosPorDia as Record<string, { inicio: string; fim: string }> | null
    let horarioInicio: string
    let horarioFim: string

    if (horariosPorDia && horariosPorDia[String(diaSemana)]) {
        // Usar horário específico do dia
        horarioInicio = horariosPorDia[String(diaSemana)].inicio
        horarioFim = horariosPorDia[String(diaSemana)].fim
    } else {
        // Usar horário padrão
        horarioInicio = format(settings.horarioInicio, 'HH:mm')
        horarioFim = format(settings.horarioFim, 'HH:mm')
    }

    // Configurar intervalo de almoço
    const intervaloAlmoco = {
        ativo: settings.intervaloAtivo,
        inicio: format(settings.intervaloInicio, 'HH:mm'),
        fim: format(settings.intervaloFim, 'HH:mm'),
    }

    // Gerar horários do dia (excluindo intervalo de almoço)
    const horarios = gerarHorarios(
        horarioInicio,
        horarioFim,
        settings.intervaloSlots,
        intervaloAlmoco
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

    // Verificar se é hoje para filtrar horários passados
    // Usar fuso horário de São Paulo (Brasil) para garantir consistência
    const agora = new Date()
    const agoraBrasil = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const isHoje = isSameDay(data, agoraBrasil)
    const horaAtualMinutos = agoraBrasil.getHours() * 60 + agoraBrasil.getMinutes()

    // Mapear disponibilidade
    return horarios.map((hora) => {
        const agendamentosNaHora = agendamentos.filter(
            (a) => format(a.hora, 'HH:mm') === hora
        ).length

        const vagas = settings.clientesPorSlot - agendamentosNaHora

        // Se for hoje, verificar se o horário já passou
        let disponivel = vagas > 0
        if (isHoje) {
            const [horaSlot, minutoSlot] = hora.split(':').map(Number)
            const slotMinutos = horaSlot * 60 + minutoSlot
            // Bloquear horários que já passaram (com 30 min de antecedência)
            if (slotMinutos <= horaAtualMinutos + 30) {
                disponivel = false
            }
        }

        return {
            hora,
            disponivel,
            vagas,
        }
    })
}
