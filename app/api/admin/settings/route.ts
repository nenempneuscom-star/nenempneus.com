import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSettings, updateSettings } from '@/lib/admin/settings'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const settings = await getSettings()

    if (!settings) {
      return NextResponse.json({ error: 'Settings nao encontradas' }, { status: 404 })
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('Erro ao buscar settings:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar settings' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const data = await req.json()

    const settings = await updateSettings(data)

    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    console.error('Erro ao atualizar settings:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar settings' },
      { status: 500 }
    )
  }
}
