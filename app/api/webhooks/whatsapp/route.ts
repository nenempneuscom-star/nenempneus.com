import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppWebhook } from '@/lib/whatsapp/types'
import { WhatsAppClient } from '@/lib/whatsapp/client'
import { salvarMensagemRecebida, salvarMensagemEnviada } from '@/lib/whatsapp/messages'
import { checkRateLimit, getRateLimitMessage } from '@/lib/whatsapp/rate-limiter'
import { processarAudioWhatsApp, isAudioSuportado } from '@/lib/whatsapp/audio'

const whatsapp = new WhatsAppClient()

// Valida se o nome do contato é um nome real (não emoji, símbolo, etc)
function validarNomeContato(nome: string): string {
    if (!nome || nome.trim().length === 0) {
        return '' // Retorna vazio para ser tratado nos prompts
    }

    // Remove emojis e caracteres especiais para verificar se sobra texto
    const semEmojis = nome.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '').trim()

    // Se após remover emojis ficou vazio ou muito curto, não é um nome válido
    if (semEmojis.length < 2) {
        return ''
    }

    // Verifica se tem pelo menos uma letra (não apenas números/símbolos)
    if (!/[a-zA-ZÀ-ÿ]/.test(semEmojis)) {
        return ''
    }

    // Retorna apenas a primeira palavra (primeiro nome) para ser mais pessoal
    const primeiroNome = semEmojis.split(/\s+/)[0]

    // Capitaliza a primeira letra
    return primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase()
}

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
                        const nomeRaw = value.contacts?.[0]?.profile?.name || ''
                        // Validar se é um nome válido (não apenas emojis, símbolos ou muito curto)
                        const nomeContato = validarNomeContato(nomeRaw)

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

                        // Marcar como lida e mostrar "digitando..."
                        await whatsapp.markAsRead(messageId)
                        await whatsapp.sendTypingIndicator(messageId)

                        // Verificar se precisa transferir para humano
                        const { verificarTransferenciaHumano } = await import('@/lib/whatsapp/ai-engine')
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
                            // Verificar timeout de 30 minutos
                            // Usa timestamp da última mensagem de SAÍDA (bot), não updatedAt da conversa
                            // (updatedAt é atualizado a cada mensagem recebida, invalidando o timeout)
                            const agora = new Date()
                            const ultimaMsgBot = await db.mensagemWhatsApp.findFirst({
                                where: { conversaId: conversa.id, direcao: 'saida' },
                                orderBy: { createdAt: 'desc' },
                                select: { createdAt: true }
                            })
                            const ultimaRespostaBot = ultimaMsgBot?.createdAt ? new Date(ultimaMsgBot.createdAt) : agora
                            const minutosEmHumano = (agora.getTime() - ultimaRespostaBot.getTime()) / (1000 * 60)

                            if (minutosEmHumano > 30) {
                                // Timeout: reverter para modo bot
                                await db.conversaWhatsApp.update({
                                    where: { id: conversa.id },
                                    data: { modo: 'bot' },
                                })
                                console.log(`⏰ Timeout modo humano (${Math.round(minutosEmHumano)}min) - revertendo para bot`)

                                const msgDesculpa = 'Desculpe a demora! Nosso atendente não está disponível no momento. Vou te atender por aqui mesmo! 😊 Como posso te ajudar?'
                                await whatsapp.sendMessage(telefone, msgDesculpa)
                                await salvarMensagemEnviada(conversa.id, msgDesculpa)

                                // Se a mensagem é só saudação/casual, a desculpa já basta — evita resposta dupla
                                const { isSaudacaoOuCasual } = await import('@/lib/whatsapp/ai-engine')
                                if (isSaudacaoOuCasual(conteudo)) {
                                    console.log('💬 Timeout + saudação: desculpa já enviada, pulando IA')
                                    continue
                                }
                                // Se é pergunta de produto, processar com IA abaixo
                            } else {
                                console.log(`👤 Aguardando atendente humano (${Math.round(minutosEmHumano)}min de ${30}min)`)
                                continue
                            }
                        }

                        // Gerar resposta com IA Anti-Alucinação
                        console.log('🤖 Gerando resposta com IA (Grok + Banco de Dados)...')
                        const { gerarRespostaIA } = await import('@/lib/whatsapp/ai-engine')
                        const respostaBot = await gerarRespostaIA(
                            conversa.id,
                            nomeContato,
                            conteudo,
                            telefone
                        )

                        // Enviar resposta de texto
                        const responseData = await whatsapp.sendMessage(telefone, respostaBot)

                        // Salvar resposta no banco
                        await salvarMensagemEnviada(
                            conversa.id,
                            respostaBot,
                            responseData.messages?.[0]?.id
                        )

                        console.log('✅ Resposta IA (Grok) enviada com sucesso')
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
