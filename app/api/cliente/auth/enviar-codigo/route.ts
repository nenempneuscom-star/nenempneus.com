import { NextRequest, NextResponse } from 'next/server'
import { enviarCodigo } from '@/lib/cliente/auth'

export async function POST(req: NextRequest) {
  try {
    const { telefone } = await req.json()

    if (!telefone) {
      return NextResponse.json(
        { error: 'Telefone e obrigatorio' },
        { status: 400 }
      )
    }

    const result = await enviarCodigo(telefone)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ message: result.message })
  } catch (error) {
    console.error('Erro na API enviar-codigo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
