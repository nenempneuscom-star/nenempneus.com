import { NextResponse } from 'next/server'
import { logoutCliente } from '@/lib/cliente/auth'

export async function POST() {
  try {
    await logoutCliente()
    return NextResponse.json({ message: 'Logout realizado com sucesso' })
  } catch (error) {
    console.error('Erro na API logout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
