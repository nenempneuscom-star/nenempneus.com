import { NextRequest, NextResponse } from 'next/server'
import { verificarCodigo } from '@/lib/cliente/auth'

export async function POST(req: NextRequest) {
  try {
    const { telefone, codigo } = await req.json()

    if (!telefone || !codigo) {
      return NextResponse.json(
        { error: 'Telefone e codigo sao obrigatorios' },
        { status: 400 }
      )
    }

    const result = await verificarCodigo(telefone, codigo)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ message: result.message })
  } catch (error) {
    console.error('Erro na API verificar-codigo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
