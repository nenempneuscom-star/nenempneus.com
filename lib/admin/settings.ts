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
    intervaloInicio: formatTime(settings.intervaloInicio),
    intervaloFim: formatTime(settings.intervaloFim),
    formasPagamento: settings.formasPagamento as string[],
    diasFuncionamento: settings.diasFuncionamento as number[],
    horariosPorDia: settings.horariosPorDia as Record<string, { inicio: string; fim: string }> | null,
    palavrasHumano: settings.palavrasHumano as string[],
    descontoPix: Number(settings.descontoPix),
    parcelasMaximas: settings.parcelasMaximas || 12,
    taxaJuros: Number(settings.taxaJuros) || 0,
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
  diasFuncionamento?: number[]
  horariosPorDia?: Record<string, { inicio: string; fim: string }> | null
  intervaloAtivo?: boolean
  intervaloInicio?: string
  intervaloFim?: string
  formasPagamento?: string[]
  descontoPix?: number
  parcelasMaximas?: number
  taxaJuros?: number
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

  if (data.diasFuncionamento !== undefined) {
    updateData.diasFuncionamento = data.diasFuncionamento
  }

  if (data.horariosPorDia !== undefined) {
    updateData.horariosPorDia = data.horariosPorDia
  }

  if (data.intervaloAtivo !== undefined) {
    updateData.intervaloAtivo = data.intervaloAtivo
  }

  if (data.intervaloInicio) {
    const [hours, minutes] = data.intervaloInicio.split(':')
    updateData.intervaloInicio = new Date(`1970-01-01T${hours}:${minutes}:00Z`)
  }

  if (data.intervaloFim) {
    const [hours, minutes] = data.intervaloFim.split(':')
    updateData.intervaloFim = new Date(`1970-01-01T${hours}:${minutes}:00Z`)
  }

  if (data.formasPagamento !== undefined) {
    updateData.formasPagamento = data.formasPagamento
  }

  if (data.descontoPix !== undefined) {
    updateData.descontoPix = data.descontoPix
  }

  if (data.parcelasMaximas !== undefined) {
    updateData.parcelasMaximas = data.parcelasMaximas
  }

  if (data.taxaJuros !== undefined) {
    updateData.taxaJuros = data.taxaJuros
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
