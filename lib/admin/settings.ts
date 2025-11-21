import { db } from '../db'
import { LOJA_SLUG } from '../constants'

export async function getSettings() {
  const loja = await db.loja.findUnique({
    where: { slug: LOJA_SLUG },
    include: { settings: true },
  })

  if (!loja?.settings) return null

  // Formatar horarios para string HH:mm
  const settings = loja.settings
  return {
    ...settings,
    horarioInicio: formatTime(settings.horarioInicio),
    horarioFim: formatTime(settings.horarioFim),
    formasPagamento: settings.formasPagamento as string[],
    diasFuncionamento: settings.diasFuncionamento as number[],
    palavrasHumano: settings.palavrasHumano as string[],
    descontoPix: Number(settings.descontoPix),
  }
}

function formatTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export async function updateSettings(data: {
  horarioInicio?: string
  horarioFim?: string
  intervaloSlots?: number
  clientesPorSlot?: number
  formasPagamento?: string[]
  descontoPix?: number
  botAtivo?: boolean
  modoBot?: string
}) {
  const loja = await db.loja.findUnique({
    where: { slug: LOJA_SLUG },
    include: { settings: true },
  })

  if (!loja || !loja.settings) {
    throw new Error('Settings nao encontradas')
  }

  // Converter horarios string para Date
  const updateData: any = {}

  if (data.horarioInicio) {
    const [hours, minutes] = data.horarioInicio.split(':')
    updateData.horarioInicio = new Date(`1970-01-01T${hours}:${minutes}:00Z`)
  }

  if (data.horarioFim) {
    const [hours, minutes] = data.horarioFim.split(':')
    updateData.horarioFim = new Date(`1970-01-01T${hours}:${minutes}:00Z`)
  }

  if (data.intervaloSlots !== undefined) {
    updateData.intervaloSlots = data.intervaloSlots
  }

  if (data.clientesPorSlot !== undefined) {
    updateData.clientesPorSlot = data.clientesPorSlot
  }

  if (data.formasPagamento !== undefined) {
    updateData.formasPagamento = data.formasPagamento
  }

  if (data.descontoPix !== undefined) {
    updateData.descontoPix = data.descontoPix
  }

  if (data.botAtivo !== undefined) {
    updateData.botAtivo = data.botAtivo
  }

  if (data.modoBot !== undefined) {
    updateData.modoBot = data.modoBot
  }

  return db.settings.update({
    where: { id: loja.settings.id },
    data: updateData,
  })
}
