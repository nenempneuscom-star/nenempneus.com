import { NextRequest, NextResponse } from 'next/server'
import { getClienteLogado } from '@/lib/cliente/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cliente = await getClienteLogado()

    if (!cliente) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const veiculos = await prisma.veiculo.findMany({
      where: { clienteId: cliente.id },
      orderBy: [{ principal: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ veiculos })
  } catch (error) {
    console.error('Erro ao buscar veiculos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const cliente = await getClienteLogado()

    if (!cliente) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { apelido, marca, modelo, ano, placa, cor, principal } = await req.json()

    if (!marca || !modelo) {
      return NextResponse.json(
        { error: 'Marca e modelo sao obrigatorios' },
        { status: 400 }
      )
    }

    // Se for principal, remover principal dos outros
    if (principal) {
      await prisma.veiculo.updateMany({
        where: { clienteId: cliente.id },
        data: { principal: false },
      })
    }

    const veiculo = await prisma.veiculo.create({
      data: {
        clienteId: cliente.id,
        apelido,
        marca,
        modelo,
        ano,
        placa,
        cor,
        principal: principal || false,
      },
    })

    return NextResponse.json({ veiculo })
  } catch (error) {
    console.error('Erro ao criar veiculo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
