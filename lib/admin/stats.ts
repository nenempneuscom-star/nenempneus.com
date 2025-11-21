import { db } from '../db'
import { LOJA_SLUG } from '../constants'
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

export async function getStats() {
  const loja = await db.loja.findUnique({
    where: { slug: LOJA_SLUG },
  })

  if (!loja) return null

  const hoje = new Date()
  const inicioMes = startOfMonth(hoje)
  const fimMes = endOfMonth(hoje)

  // Total de pedidos
  const totalPedidos = await db.pedido.count({
    where: {
      lojaId: loja.id,
    },
  })

  // Pedidos hoje
  const pedidosHoje = await db.pedido.count({
    where: {
      lojaId: loja.id,
      createdAt: {
        gte: startOfDay(hoje),
        lte: endOfDay(hoje),
      },
    },
  })

  // Pedidos do mês
  const pedidosMes = await db.pedido.count({
    where: {
      lojaId: loja.id,
      createdAt: {
        gte: inicioMes,
        lte: fimMes,
      },
    },
  })

  // Receita total
  const receitaTotal = await db.pedido.aggregate({
    where: {
      lojaId: loja.id,
      status: 'pago',
    },
    _sum: {
      total: true,
    },
  })

  // Receita do mês
  const receitaMes = await db.pedido.aggregate({
    where: {
      lojaId: loja.id,
      status: 'pago',
      createdAt: {
        gte: inicioMes,
        lte: fimMes,
      },
    },
    _sum: {
      total: true,
    },
  })

  // Agendamentos hoje
  const agendamentosHoje = await db.agendamento.count({
    where: {
      lojaId: loja.id,
      data: hoje,
      status: {
        in: ['confirmado', 'em_andamento'],
      },
    },
  })

  // Conversas WhatsApp ativas
  const conversasAtivas = await db.conversaWhatsApp.count({
    where: {
      lojaId: loja.id,
      status: 'ativa',
    },
  })

  return {
    pedidos: {
      total: totalPedidos,
      hoje: pedidosHoje,
      mes: pedidosMes,
    },
    receita: {
      total: Number(receitaTotal._sum.total || 0),
      mes: Number(receitaMes._sum.total || 0),
    },
    agendamentos: {
      hoje: agendamentosHoje,
    },
    whatsapp: {
      conversasAtivas,
    },
  }
}

export async function getPedidosRecentes() {
  const loja = await db.loja.findUnique({
    where: { slug: LOJA_SLUG },
  })

  if (!loja) return []

  return db.pedido.findMany({
    where: {
      lojaId: loja.id,
    },
    include: {
      cliente: true,
      items: {
        include: {
          produto: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })
}
