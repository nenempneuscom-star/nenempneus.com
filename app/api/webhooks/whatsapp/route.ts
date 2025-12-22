import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppWebhook } from '@/lib/whatsapp/types'
import { WhatsAppClient } from '@/lib/whatsapp/client'
import { salvarMensagemRecebida, salvarMensagemEnviada } from '@/lib/whatsapp/messages'
import { checkRateLimit, getRateLimitMessage } from '@/lib/whatsapp/rate-limiter'
import { processarAudioWhatsApp, isAudioSuportado } from '@/lib/whatsapp/audio'

const whatsapp = new WhatsAppClient()

// GET - Verificação do webhook (Meta exige)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || 'placeholder-verify-token'

    console.log('🔍 Verificação webhook recebida:', { mode, token, challenge: challenge?.substring(0, 20) })

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ Webhook verificado com sucesso!')
        // Meta exige resposta em text/plain com apenas o challenge
        return new Response(challenge || '', {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
            },
        })
    }

    console.log('❌ Verificação falhou - token inválido ou mode incorreto')
    return new Response('Forbidden', { status: 403 })
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
                        const telefone = message.from
                        const messageId = message.id
                        const nomeContato = value.contacts?.[0]?.profile?.name || 'Cliente'

                        let conteudo = ''

                        // Processar diferentes tipos de mensagem
                        if (message.type === 'text') {
                            conteudo = message.text?.body || ''
                        } else if (message.type === 'audio') {
                            // Processar áudio - transcrever para texto
                            const audioId = message.audio?.id
                            const mimeType = message.audio?.mime_type || 'audio/ogg'

                            if (audioId && isAudioSuportado(mimeType)) {
                                console.log(`🎤 Áudio recebido de ${nomeContato} (${telefone})`)

                                const resultado = await processarAudioWhatsApp(audioId, mimeType)
                                if (resultado.sucesso) {
                                    conteudo = resultado.texto
                                    console.log(`✅ Áudio transcrito: "${conteudo.substring(0, 100)}..."`)
                                } else {
                                    // Informa que não conseguiu processar o áudio
                                    await whatsapp.sendMessage(
                                        telefone,
                                        'Desculpe, não consegui entender seu áudio. Pode digitar sua mensagem? 😊'
                                    )
                                    continue
                                }
                            } else {
                                console.log(`⚠️ Áudio não suportado: ${mimeType}`)
                                await whatsapp.sendMessage(
                                    telefone,
                                    'Desculpe, esse formato de áudio não é suportado. Pode enviar de outra forma ou digitar? 😊'
                                )
                                continue
                            }
                        } else if (message.type === 'image' || message.type === 'video' || message.type === 'document') {
                            // Para outros tipos de mídia, pedir para digitar
                            await whatsapp.sendMessage(
                                telefone,
                                'Recebi sua mídia! Por enquanto só consigo processar textos e áudios. Pode me contar por escrito o que precisa? 😊'
                            )
                            continue
                        } else {
                            // Tipo não suportado
                            continue
                        }

                        // Se não tem conteúdo, pula
                        if (!conteudo.trim()) continue

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
