import { db } from '../../db'
import { LOJA_SLUG } from '../../constants'
import { format, addDays, isBefore, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface SlotDisponivel {
    data: Date
    hora: string
    horaFormatada: string
    disponivel: boolean
}

export interface HorariosFuncionamento {
    inicio: string
    fim: string
    intervaloInicio?: string
    intervaloFim?: string
}

// Busca configurações de horário da loja
async function getConfiguracoesLoja() {
    const loja = await db.loja.findUnique({
        where: { slug: LOJA_SLUG },
        include: { settings: true },
    })

    if (!loja?.settings) {
        // Configurações padrão
        return {
            horarioInicio: '08:00',
            horarioFim: '18:00',
            intervaloSlots: 60, // minutos
            clientesPorSlot: 2,
            diasFuncionamento: [1, 2, 3, 4, 5, 6], // seg a sab
            intervaloAtivo: true,
            intervaloInicio: '12:00',
            intervaloFim: '13:00',
        }
    }

    const s = loja.settings
    return {
        horarioInicio: format(s.horarioInicio, 'HH:mm'),
        horarioFim: format(s.horarioFim, 'HH:mm'),
        intervaloSlots: s.intervaloSlots,
        clientesPorSlot: s.clientesPorSlot,
        diasFuncionamento: s.diasFuncionamento as number[],
        intervaloAtivo: s.intervaloAtivo,
        intervaloInicio: format(s.intervaloInicio, 'HH:mm'),
        intervaloFim: format(s.intervaloFim, 'HH:mm'),
    }
}

// Gera lista de horários para um dia
function gerarHorariosDia(
    config: Awaited<ReturnType<typeof getConfiguracoesLoja>>
): string[] {
    const horarios: string[] = []

    const [inicioH, inicioM] = config.horarioInicio.split(':').map(Number)
    const [fimH, fimM] = config.horarioFim.split(':').map(Number)
    const [intervaloInicioH, intervaloInicioM] = config.intervaloAtivo
        ? config.intervaloInicio.split(':').map(Number)
        : [0, 0]
    const [intervaloFimH, intervaloFimM] = config.intervaloAtivo
        ? config.intervaloFim.split(':').map(Number)
        : [0, 0]

    let hora = inicioH
    let minuto = inicioM

    while (hora < fimH || (hora === fimH && minuto < fimM)) {
        const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`

        // Verifica se está no intervalo de almoço
        const noIntervalo = config.intervaloAtivo &&
            ((hora > intervaloInicioH || (hora === intervaloInicioH && minuto >= intervaloInicioM)) &&
                (hora < intervaloFimH || (hora === intervaloFimH && minuto < intervaloFimM)))

        if (!noIntervalo) {
            horarios.push(horaStr)
        }

        // Avança para próximo slot
        minuto += config.intervaloSlots
        if (minuto >= 60) {
            hora += Math.floor(minuto / 60)
            minuto = minuto % 60
        }
    }

    return horarios
}

// Busca slots disponíveis para os próximos dias
export async function buscarSlotsDisponiveis(
    diasAFrente: number = 7
): Promise<SlotDisponivel[]> {
    try {
        const config = await getConfiguracoesLoja()
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) return []

        const slots: SlotDisponivel[] = []
        const hoje = new Date()

        for (let i = 0; i < diasAFrente; i++) {
            const data = addDays(hoje, i)
            const diaSemana = data.getDay()

            // Verifica se é dia de funcionamento
            if (!config.diasFuncionamento.includes(diaSemana)) {
                continue
            }

            const horarios = gerarHorariosDia(config)

            for (const hora of horarios) {
                // Se for hoje, pula horários passados
                if (i === 0) {
                    const [h, m] = hora.split(':').map(Number)
                    const horaSlot = setMinutes(setHours(new Date(), h), m)
                    if (isBefore(horaSlot, new Date())) {
                        continue
                    }
                }

                // Conta agendamentos existentes neste slot
                const [h, m] = hora.split(':').map(Number)
                const horaDate = setMinutes(setHours(new Date(data), h), m)

                const agendamentosNoSlot = await db.agendamento.count({
                    where: {
                        lojaId: loja.id,
                        data: {
                            gte: new Date(data.setHours(0, 0, 0, 0)),
                            lt: new Date(data.setHours(23, 59, 59, 999)),
                        },
                        hora: horaDate,
                        status: { in: ['confirmado', 'pendente'] },
                    },
                })

                const disponivel = agendamentosNoSlot < config.clientesPorSlot

                slots.push({
                    data,
                    hora,
                    horaFormatada: format(horaDate, "HH:mm"),
                    disponivel,
                })
            }
        }

        // Retorna apenas slots disponíveis
        return slots.filter((s) => s.disponivel)
    } catch (error) {
        console.error('Erro ao buscar slots:', error)
        return []
    }
}

// Busca próximos horários disponíveis (para sugestão rápida)
export async function buscarProximosHorarios(
    quantidade: number = 3
): Promise<SlotDisponivel[]> {
    const slots = await buscarSlotsDisponiveis(7)
    return slots.slice(0, quantidade)
}

// Verifica se um slot específico está disponível
export async function verificarSlotDisponivel(
    data: Date,
    hora: string
): Promise<boolean> {
    try {
        const config = await getConfiguracoesLoja()
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) return false

        const [h, m] = hora.split(':').map(Number)
        const horaDate = setMinutes(setHours(new Date(data), h), m)

        const agendamentosNoSlot = await db.agendamento.count({
            where: {
                lojaId: loja.id,
                data: {
                    gte: new Date(data.setHours(0, 0, 0, 0)),
                    lt: new Date(data.setHours(23, 59, 59, 999)),
                },
                hora: horaDate,
                status: { in: ['confirmado', 'pendente'] },
            },
        })

        return agendamentosNoSlot < config.clientesPorSlot
    } catch (error) {
        console.error('Erro ao verificar slot:', error)
        return false
    }
}

// Formata slots para WhatsApp
export function formatarSlotsWhatsApp(slots: SlotDisponivel[]): string {
    if (slots.length === 0) {
        return '😕 Não encontrei horários disponíveis nos próximos dias. Posso verificar outros dias?'
    }

    let texto = '📅 *Horários disponíveis:*\n\n'

    // Agrupa por data
    const porData = new Map<string, SlotDisponivel[]>()
    for (const slot of slots) {
        const dataKey = format(slot.data, 'yyyy-MM-dd')
        if (!porData.has(dataKey)) {
            porData.set(dataKey, [])
        }
        porData.get(dataKey)!.push(slot)
    }

    let contador = 1
    for (const [dataKey, slotsData] of porData.entries()) {
        const data = new Date(dataKey)
        const dataFormatada = format(data, "EEEE, dd/MM", { locale: ptBR })

        texto += `*${dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)}*\n`

        for (const slot of slotsData.slice(0, 4)) { // Max 4 por dia
            texto += `   ${contador}. ${slot.hora}\n`
            contador++
        }

        texto += '\n'

        if (contador > 6) break // Máximo 6 opções
    }

    texto += 'Qual horário prefere? Responda com o número.'

    return texto
}

// Formata slots como lista interativa
export function formatarSlotsComoLista(
    slots: SlotDisponivel[]
): {
    titulo: string
    rows: Array<{ id: string; title: string; description: string }>
}[] {
    const sections: {
        titulo: string
        rows: Array<{ id: string; title: string; description: string }>
    }[] = []

    // Agrupa por data
    const porData = new Map<string, SlotDisponivel[]>()
    for (const slot of slots) {
        const dataKey = format(slot.data, 'yyyy-MM-dd')
        if (!porData.has(dataKey)) {
            porData.set(dataKey, [])
        }
        porData.get(dataKey)!.push(slot)
    }

    for (const [dataKey, slotsData] of porData.entries()) {
        const data = new Date(dataKey)
        const dataFormatada = format(data, "EEEE, dd/MM", { locale: ptBR })

        sections.push({
            titulo: dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1),
            rows: slotsData.slice(0, 3).map((slot) => ({
                id: `slot_${dataKey}_${slot.hora.replace(':', '')}`,
                title: slot.hora,
                description: `Agendar para ${slot.hora}`,
            })),
        })

        if (sections.length >= 3) break // Máximo 3 seções
    }

    return sections
}

// Extrai data/hora de uma mensagem do usuário
export function extrairDataHoraMensagem(
    mensagem: string
): { data?: Date; hora?: string } | null {
    const msg = mensagem.toLowerCase()
    const resultado: { data?: Date; hora?: string } = {}

    // Detecta "hoje", "amanhã"
    if (msg.includes('hoje')) {
        resultado.data = new Date()
    } else if (msg.includes('amanha') || msg.includes('amanhã')) {
        resultado.data = addDays(new Date(), 1)
    }

    // Detecta dias da semana
    const diasSemana = ['domingo', 'segunda', 'terça', 'terca', 'quarta', 'quinta', 'sexta', 'sábado', 'sabado']
    for (let i = 0; i < diasSemana.length; i++) {
        if (msg.includes(diasSemana[i])) {
            const hoje = new Date()
            const diaAtual = hoje.getDay()
            const diaAlvo = i >= 7 ? i - 7 : (i === 2 || i === 3) ? 2 : i // normaliza terça
            let diasAte = diaAlvo - diaAtual
            if (diasAte <= 0) diasAte += 7

            resultado.data = addDays(hoje, diasAte)
            break
        }
    }

    // Detecta hora (formato HH:MM ou Hh)
    const horaRegex = /(\d{1,2})[h:]\s*(\d{0,2})?/
    const matchHora = msg.match(horaRegex)
    if (matchHora) {
        const hora = matchHora[1].padStart(2, '0')
        const minuto = (matchHora[2] || '00').padStart(2, '0')
        resultado.hora = `${hora}:${minuto}`
    }

    // Detecta "manhã", "tarde"
    if (msg.includes('manha') || msg.includes('manhã')) {
        resultado.hora = resultado.hora || '09:00'
    } else if (msg.includes('tarde')) {
        resultado.hora = resultado.hora || '14:00'
    }

    return Object.keys(resultado).length > 0 ? resultado : null
}

// Gera mensagem de confirmação de agendamento
export function gerarMensagemConfirmacao(
    data: Date,
    hora: string,
    nomeCliente?: string
): string {
    const dataFormatada = format(data, "EEEE, dd 'de' MMMM", { locale: ptBR })
    const saudacao = nomeCliente ? `${nomeCliente}, ` : ''

    let texto = `✅ *Agendamento confirmado!*\n\n`
    texto += `${saudacao}sua instalação está marcada para:\n\n`
    texto += `📅 *${dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)}*\n`
    texto += `⏰ *${hora}*\n\n`
    texto += `📍 Endereço: Av. Nereu Ramos, 740 - Centro\n`
    texto += `   Capivari de Baixo, SC\n\n`
    texto += `Chegue com 10 minutinhos de antecedência, tá? 😊\n\n`
    texto += `Se precisar remarcar, é só me avisar aqui!`

    return texto
}
