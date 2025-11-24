import { NextRequest, NextResponse } from 'next/server'
import { getClienteLogado } from '@/lib/cliente/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  try {
    const cliente = await getClienteLogado()

    if (!cliente) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { nome, email, cpf } = await req.json()

    if (!nome || nome.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome e obrigatorio' },
        { status: 400 }
      )
    }

    const clienteAtualizado = await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        nome: nome.trim(),
        email: email || null,
        cpf: cpf || null,
      },
    })

    return NextResponse.json({ cliente: clienteAtualizado })
  } catch (error) {
    console.error('Erro ao atualizar dados:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
