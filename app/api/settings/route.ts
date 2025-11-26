import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/admin/settings'

// Endpoint público para buscar configurações necessárias no frontend
export async function GET() {
  try {
    const settings = await getSettings()

    if (!settings) {
      return NextResponse.json({ error: 'Settings não encontradas' }, { status: 404 })
    }

    // Retorna apenas configurações públicas necessárias
    return NextResponse.json({
      parcelasMaximas: settings.parcelasMaximas,
      taxaJuros: settings.taxaJuros,
      descontoPix: settings.descontoPix,
      formasPagamento: settings.formasPagamento,
    })
  } catch (error: any) {
    console.error('Erro ao buscar settings:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar settings' },
      { status: 500 }
    )
  }
}
