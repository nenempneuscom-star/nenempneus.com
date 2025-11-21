import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppWebhook } from '@/lib/whatsapp/types'
import { WhatsAppClient } from '@/lib/whatsapp/client'
import { salvarMensagemRecebida, salvarMensagemEnviada } from '@/lib/whatsapp/messages'
import { checkRateLimit, getRateLimitMessage } from '@/lib/whatsapp/rate-limiter'

const whatsapp = new WhatsAppClient()

// GET - Verificação do webhook (Meta exige)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || 'placeholder-verify-token'

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ Webhook verificado com sucesso!')
        return new NextResponse(challenge, { status: 200 })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST - Receber mensagens
export async function POST(req: NextRequest) {
    try {
        const body: WhatsAppWebhook = await req.json()

        console.log('📩 Webhook WhatsApp recebido:', JSON.stringify(body, null, 2))

        // Verificar se é mensagem
        if (body.object !== 'whatsapp_business_account') {
            return NextResponse.json({ success: true })
        }

        for (const entry of body.entry) {
            for (const change of entry.changes) {
                const value = change.value

                // Processar mensagens
                if (value.messages && value.messages.length > 0) {
                    for (const message of value.messages) {
                        // Só processar mensagens de texto
                        if (message.type !== 'text') continue

                        const telefone = message.from
                        const conteudo = message.text?.body || ''
                        const messageId = message.id
                        const nomeContato = value.contacts?.[0]?.profile?.name || 'Cliente'

                        console.log(`📱 Mensagem de ${nomeContato} (${telefone}): ${conteudo}`)

                        // Verificar rate limit
                        const rateLimit = checkRateLimit(telefone)
                        if (!rateLimit.allowed) {
                            console.log('🚫 Rate limit excedido:', telefone)
                            await whatsapp.sendMessage(telefone, getRateLimitMessage())
                            continue
                        }
                        console.log(`✅ Rate limit OK (${rateLimit.remaining} remaining)`)

                        // Salvar mensagem no banco
                        const { conversa } = await salvarMensagemRecebida(
                            telefone,
                            nomeContato,
                            conteudo,
                            messageId
                        )

                        // Marcar como lida
                        await whatsapp.markAsRead(messageId)

                        // Verificar se precisa transferir para humano
                        const { verificarTransferenciaHumano } = await import('@/lib/whatsapp/bot')
                        if (verificarTransferenciaHumano(conteudo)) {
                            // Atualizar modo da conversa
                            const { db } = await import('@/lib/db')
                            await db.conversaWhatsApp.update({
                                where: { id: conversa.id },
                                data: { modo: 'humano' },
                            })

                            const respostaTransferencia = `Entendido! Vou transferir você para um de nossos atendentes. 👨‍💼\n\nUm momento, por favor...`

                            await whatsapp.sendMessage(telefone, respostaTransferencia)
                            await salvarMensagemEnviada(conversa.id, respostaTransferencia)

                            console.log('🔄 Conversa transferida para atendente humano')
                            continue
                        }

                        // Se modo for 'humano', não responder automaticamente
                        const { db } = await import('@/lib/db')
                        const conversaAtual = await db.conversaWhatsApp.findUnique({
                            where: { id: conversa.id },
                        })

                        if (conversaAtual?.modo === 'humano') {
                            console.log('👤 Aguardando atendente humano - bot não responde')
                            continue
                        }

                        // Gerar resposta com IA
                        console.log('🤖 Gerando resposta com Claude...')
                        const { gerarRespostaBot } = await import('@/lib/whatsapp/bot')
                        const respostaBot = await gerarRespostaBot(
                            conversa.id,
                            nomeContato,
                            conteudo
                        )

                        // Enviar resposta
                        const responseData = await whatsapp.sendMessage(telefone, respostaBot)

                        // Salvar resposta no banco
                        await salvarMensagemEnviada(
                            conversa.id,
                            respostaBot,
                            responseData.messages?.[0]?.id
                        )

                        console.log('✅ Resposta IA enviada com sucesso')
                    }
                }

                // Processar status de mensagens (entregue, lida, etc)
                if (value.statuses && value.statuses.length > 0) {
                    console.log('📊 Status atualizado:', value.statuses)
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('❌ Erro no webhook WhatsApp:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
