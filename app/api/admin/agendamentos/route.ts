import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LOJA_SLUG } from '@/lib/constants'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    // Buscar loja
    const loja = await db.loja.findUnique({
      where: { slug: LOJA_SLUG },
    })

    if (!loja) {
      return NextResponse.json({ error: 'Loja nao encontrada' }, { status: 404 })
    }

    // Construir filtros
    const where: any = {
      lojaId: loja.id,
    }

    if (status && status !== 'todos') {
      where.status = status
    }

    if (dataInicio) {
      where.data = {
        ...where.data,
        gte: new Date(dataInicio),
      }
    }

    if (dataFim) {
      where.data = {
        ...where.data,
        lte: new Date(dataFim),
      }
    }

    // Buscar agendamentos com relacoes
    const agendamentos = await db.agendamento.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true,
            veiculoMarca: true,
            veiculoModelo: true,
            veiculoPlaca: true,
          },
        },
        pedido: {
          select: {
            id: true,
            numero: true,
            total: true,
            status: true,
            items: {
              include: {
                produto: {
                  select: {
                    nome: true,
                    specs: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { data: 'asc' },
        { hora: 'asc' },
      ],
    })

    // Formatar dados para o frontend
    const agendamentosFormatados = agendamentos.map((ag) => ({
      id: ag.id,
      data: ag.data.toISOString().split('T')[0],
      hora: formatTime(ag.hora),
      status: ag.status,
      observacoes: ag.observacoes,
      lembreteEnviado: ag.lembreteEnviado,
      createdAt: ag.createdAt.toISOString(),
      cliente: ag.cliente,
      pedido: ag.pedido ? {
        ...ag.pedido,
        total: Number(ag.pedido.total),
      } : null,
    }))

    return NextResponse.json({ agendamentos: agendamentosFormatados })
  } catch (error: any) {
    console.error('Erro ao buscar agendamentos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar agendamentos' },
      { status: 500 }
    )
  }
}

function formatTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
