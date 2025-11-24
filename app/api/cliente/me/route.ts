import { NextResponse } from 'next/server'
import { getClienteLogado } from '@/lib/cliente/auth'

export async function GET() {
  try {
    const cliente = await getClienteLogado()

    if (!cliente) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    return NextResponse.json({ cliente })
  } catch (error) {
    console.error('Erro na API me:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
