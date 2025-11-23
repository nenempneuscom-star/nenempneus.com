import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { WhatsAppClient } from '@/lib/whatsapp/client'
import { salvarMensagemEnviada } from '@/lib/whatsapp/messages'
import { db } from '@/lib/db'

const whatsapp = new WhatsAppClient()

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticacao
    // const session = await getSession()
    // if (!session) {
    //   return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    // }

    const { conversaId, mensagem } = await req.json()

    if (!conversaId || !mensagem) {
      return NextResponse.json(
        { error: 'conversaId e mensagem sao obrigatorios' },
        { status: 400 }
      )
    }

    // Buscar conversa para pegar telefone
    const conversa = await db.conversaWhatsApp.findUnique({
      where: { id: conversaId },
    })

    if (!conversa) {
      return NextResponse.json(
        { error: 'Conversa nao encontrada' },
        { status: 404 }
      )
    }

    // Enviar via WhatsApp API
    const response = await whatsapp.sendMessage(conversa.telefone, mensagem)

    // Salvar no banco
    await salvarMensagemEnviada(
      conversaId,
      mensagem,
      response.messages?.[0]?.id
    )

    // Atualizar modo para humano (ja que admin esta respondendo)
    await db.conversaWhatsApp.update({
      where: { id: conversaId },
      data: { modo: 'humano' },
    })

    console.log('✅ Mensagem enviada pelo admin:', mensagem.substring(0, 50))

    return NextResponse.json({ success: true, messageId: response.messages?.[0]?.id })
  } catch (error: any) {
    console.error('❌ Erro ao enviar mensagem:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}
