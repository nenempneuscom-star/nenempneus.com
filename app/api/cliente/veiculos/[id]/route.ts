import { NextRequest, NextResponse } from 'next/server'
import { getClienteLogado } from '@/lib/cliente/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const cliente = await getClienteLogado()

    if (!cliente) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    // Verificar se o veiculo pertence ao cliente
    const veiculoExistente = await prisma.veiculo.findFirst({
      where: { id, clienteId: cliente.id },
    })

    if (!veiculoExistente) {
      return NextResponse.json({ error: 'Veiculo nao encontrado' }, { status: 404 })
    }

    const data = await req.json()

    // Se for principal, remover principal dos outros
    if (data.principal) {
      await prisma.veiculo.updateMany({
        where: { clienteId: cliente.id, id: { not: id } },
        data: { principal: false },
      })
    }

    const veiculo = await prisma.veiculo.update({
      where: { id },
      data,
    })

    return NextResponse.json({ veiculo })
  } catch (error) {
    console.error('Erro ao atualizar veiculo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const cliente = await getClienteLogado()

    if (!cliente) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    // Verificar se o veiculo pertence ao cliente
    const veiculoExistente = await prisma.veiculo.findFirst({
      where: { id, clienteId: cliente.id },
    })

    if (!veiculoExistente) {
      return NextResponse.json({ error: 'Veiculo nao encontrado' }, { status: 404 })
    }

    await prisma.veiculo.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar veiculo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
