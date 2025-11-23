import { db } from '../db'
import { LOJA_SLUG } from '../constants'
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

export async function getStats() {
  try {
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
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    // Retornar dados mockados em caso de erro (ex: banco indisponível)
    return {
      pedidos: { total: 0, hoje: 0, mes: 0 },
      receita: { total: 0, mes: 0 },
      agendamentos: { hoje: 0 },
      whatsapp: { conversasAtivas: 0 },
    }
  }
}

export async function getPedidosRecentes() {
  try {
    const loja = await db.loja.findUnique({
      where: { slug: LOJA_SLUG },
    })

    if (!loja) return []

    return await db.pedido.findMany({
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
  } catch (error) {
    console.error('Erro ao buscar pedidos recentes:', error)
    return []
  }
}
