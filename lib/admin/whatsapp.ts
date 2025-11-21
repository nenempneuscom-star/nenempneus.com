import { db } from '../db'
import { LOJA_SLUG } from '../constants'

export async function getConversas() {
  const loja = await db.loja.findUnique({
    where: { slug: LOJA_SLUG },
  })

  if (!loja) return []

  return db.conversaWhatsApp.findMany({
    where: {
      lojaId: loja.id,
    },
    orderBy: {
      ultimaMensagemEm: 'desc',
    },
    take: 50,
  })
}

export async function getConversa(conversaId: string) {
  return db.conversaWhatsApp.findUnique({
    where: { id: conversaId },
    include: {
      mensagens: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })
}

export async function getMensagens(conversaId: string) {
  return db.mensagemWhatsApp.findMany({
    where: { conversaId },
    orderBy: {
      createdAt: 'asc',
    },
  })
}

export async function alterarModoConversa(conversaId: string, modo: 'bot' | 'humano') {
  return db.conversaWhatsApp.update({
    where: { id: conversaId },
    data: { modo },
  })
}
