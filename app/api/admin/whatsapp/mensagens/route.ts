import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getConversa } from '@/lib/admin/whatsapp'

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticacao
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const conversaId = req.nextUrl.searchParams.get('conversaId')

    if (!conversaId) {
      return NextResponse.json(
        { error: 'conversaId e obrigatorio' },
        { status: 400 }
      )
    }

    const conversa = await getConversa(conversaId)

    if (!conversa) {
      return NextResponse.json(
        { error: 'Conversa nao encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ conversa })
  } catch (error: any) {
    console.error('❌ Erro ao buscar mensagens:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar mensagens' },
      { status: 500 }
    )
  }
}
