import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const pedidoNumero = params.id

    // Buscar pedido com todos os relacionamentos
    const pedido = await db.pedido.findUnique({
      where: { numero: pedidoNumero },
      include: {
        cliente: true,
        items: {
          include: {
            produto: true,
          },
        },
        agendamento: true,
        pagamentos: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Formatar resposta
    return NextResponse.json({
      pedido: {
        numero: pedido.numero,
        status: pedido.status,
        subtotal: Number(pedido.subtotal),
        desconto: Number(pedido.desconto),
        total: Number(pedido.total),
        observacoes: pedido.observacoes,
        createdAt: pedido.createdAt,
        cliente: {
          nome: pedido.cliente.nome,
          email: pedido.cliente.email,
          telefone: pedido.cliente.telefone,
        },
        items: pedido.items.map((item) => ({
          id: item.id,
          nome: item.produto.nome,
          quantidade: item.quantidade,
          precoUnit: Number(item.precoUnit),
          subtotal: Number(item.subtotal),
        })),
        agendamento: pedido.agendamento
          ? {
              data: pedido.agendamento.data,
              hora: pedido.agendamento.hora,
              status: pedido.agendamento.status,
            }
          : null,
        pagamentos: pedido.pagamentos.map((pag) => ({
          gateway: pag.gateway,
          metodo: pag.metodo,
          status: pag.status,
          valor: Number(pag.valor),
          createdAt: pag.createdAt,
        })),
      },
    })
  } catch (error: any) {
    console.error('Erro ao buscar pedido:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar pedido' },
      { status: 500 }
    )
  }
}
