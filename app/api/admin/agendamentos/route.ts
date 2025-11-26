import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LOJA_SLUG } from '@/lib/constants'
import { getSession } from '@/lib/auth'

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

// POST - Criar novo agendamento
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { clienteId, pedidoId, data, hora, observacoes, status } = body

    if (!clienteId || !data || !hora) {
      return NextResponse.json(
        { error: 'Cliente, data e hora são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário para verificar lojaId
    const usuario = await db.usuario.findUnique({
      where: { id: session.userId },
      select: { lojaId: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Criar agendamento
    const dataObj = new Date(data)
    const horaObj = new Date(`1970-01-01T${hora}:00`)

    const agendamento = await db.agendamento.create({
      data: {
        lojaId: usuario.lojaId,
        clienteId,
        pedidoId: pedidoId || null,
        data: dataObj,
        hora: horaObj,
        status: status || 'confirmado',
        observacoes: observacoes || null
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true
          }
        },
        pedido: {
          select: {
            id: true,
            numero: true
          }
        }
      }
    })

    // Se tiver pedido, atualizar flag temAgendamento
    if (pedidoId) {
      await db.pedido.update({
        where: { id: pedidoId },
        data: { temAgendamento: true }
      })
    }

    return NextResponse.json({
      success: true,
      agendamento
    })
  } catch (error: any) {
    console.error('Erro ao criar agendamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar agendamento' },
      { status: 500 }
    )
  }
}

function formatTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
