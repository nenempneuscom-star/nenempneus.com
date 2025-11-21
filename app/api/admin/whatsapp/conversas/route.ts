import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getConversas } from '@/lib/admin/whatsapp'

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticacao
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const conversas = await getConversas()

    return NextResponse.json({ conversas })
  } catch (error: any) {
    console.error('❌ Erro ao buscar conversas:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar conversas' },
      { status: 500 }
    )
  }
}
