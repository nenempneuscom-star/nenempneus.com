import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppWebhook } from '@/lib/whatsapp/types'
import { WhatsAppClient } from '@/lib/whatsapp/client'
import { salvarMensagemRecebida, salvarMensagemEnviada } from '@/lib/whatsapp/messages'
import { checkRateLimit, getRateLimitMessage } from '@/lib/whatsapp/rate-limiter'
import { processarAudioWhatsApp, isAudioSuportado } from '@/lib/whatsapp/audio'

// Aumentar timeout para 60s (necessário para IA processar e responder)
export const maxDuration = 60

const whatsapp = new WhatsAppClient()

// Deduplicação: evita reprocessar mensagens que o WhatsApp reenvia
const mensagensProcessadas = new Set<string>()

function marcarComoProcessada(messageId: string): void {
    mensagensProcessadas.add(messageId)
    // Limpar após 5 minutos para não crescer indefinidamente
    setTimeout(() => mensagensProcessadas.delete(messageId), 5 * 60 * 1000)
}

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

/**
 * Processa mensagem em background (fire-and-forget)
 * Toda a lógica pesada (IA, envio de resposta, triggers) roda aqui
 */
async function processarMensagemAsync(
    telefone: string,
    nomeContato: string,
    conteudo: string,
    messageId: string,
    conversaId: string,
): Promise<void> {
    try {
        // Marcar como lida e mostrar "digitando..."
        await whatsapp.markAsRead(messageId)
        await whatsapp.sendTypingIndicator(messageId)

        // Trigger: mensagem recebida (métricas)
        const { onMensagemRecebida } = await import('@/lib/whatsapp/follow-up/triggers')
        onMensagemRecebida(conversaId, conteudo).catch(err =>
            console.error('Erro no trigger onMensagemRecebida:', err)
        )

        // Verificar se precisa transferir para humano
        const { verificarTransferenciaHumano, isEncerramento } = await import('@/lib/whatsapp/ai-engine')
        if (verificarTransferenciaHumano(conteudo)) {
            const { db } = await import('@/lib/db')
            await db.conversaWhatsApp.update({
                where: { id: conversaId },
                data: { modo: 'humano' },
            })

            const respostaTransferencia = `Entendido! Vou transferir você para um de nossos atendentes. 👨‍💼\n\nUm momento, por favor...`
            await whatsapp.sendMessage(telefone, respostaTransferencia)
            await salvarMensagemEnviada(conversaId, respostaTransferencia)

            // Trigger: transferência para humano
            const { onTransferenciaHumano } = await import('@/lib/whatsapp/follow-up/triggers')
            onTransferenciaHumano(conversaId, 'solicitacao_cliente').catch(err =>
                console.error('Erro no trigger onTransferenciaHumano:', err)
            )

            console.log('🔄 Conversa transferida para atendente humano')
            return
        }

        // Se modo for 'humano', não responder automaticamente
        const { db } = await import('@/lib/db')
        const conversaAtual = await db.conversaWhatsApp.findUnique({
            where: { id: conversaId },
        })

        if (conversaAtual?.modo === 'humano') {
            // Verificar timeout de 30 minutos
            const agora = new Date()
            const ultimaMsgBot = await db.mensagemWhatsApp.findFirst({
                where: { conversaId, direcao: 'saida' },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            })
            const ultimaRespostaBot = ultimaMsgBot?.createdAt ? new Date(ultimaMsgBot.createdAt) : agora
            const minutosEmHumano = (agora.getTime() - ultimaRespostaBot.getTime()) / (1000 * 60)

            if (minutosEmHumano > 30) {
                // Timeout: reverter para modo bot
                await db.conversaWhatsApp.update({
                    where: { id: conversaId },
                    data: { modo: 'bot' },
                })
                console.log(`⏰ Timeout modo humano (${Math.round(minutosEmHumano)}min) - revertendo para bot`)

                const msgDesculpa = 'Desculpe a demora! Nosso atendente não está disponível no momento. Vou te atender por aqui mesmo! 😊 Como posso te ajudar?'
                await whatsapp.sendMessage(telefone, msgDesculpa)
                await salvarMensagemEnviada(conversaId, msgDesculpa)

                // Se a mensagem é só saudação/casual, a desculpa já basta
                const { isSaudacaoOuCasual } = await import('@/lib/whatsapp/ai-engine')
                if (isSaudacaoOuCasual(conteudo)) {
                    console.log('💬 Timeout + saudação: desculpa já enviada, pulando IA')
                    return
                }
            } else {
                console.log(`👤 Aguardando atendente humano (${Math.round(minutosEmHumano)}min de ${30}min)`)
                return
            }
        }

        // Gerar resposta com IA Anti-Alucinação
        console.log('🤖 Gerando resposta com IA (Claude Sonnet + Banco de Dados)...')
        const { gerarRespostaIA } = await import('@/lib/whatsapp/ai-engine')
        const { texto: respostaBot, produtosComImagem } = await gerarRespostaIA(
            conversaId,
            nomeContato,
            conteudo,
            telefone
        )

        // Enviar resposta de texto
        const responseData = await whatsapp.sendMessage(telefone, respostaBot)

        // Salvar resposta no banco
        await salvarMensagemEnviada(
            conversaId,
            respostaBot,
            responseData.messages?.[0]?.id
        )

        console.log('✅ Resposta IA (Claude Sonnet) enviada com sucesso')

        // Trigger: mensagem enviada (métricas)
        const { onMensagemEnviada, onOrcamentoEnviado, onLeadPerdido } = await import('@/lib/whatsapp/follow-up/triggers')
        onMensagemEnviada(conversaId, respostaBot, true).catch(err =>
            console.error('Erro no trigger onMensagemEnviada:', err)
        )

        // Trigger: orçamento enviado (se a resposta contém produto com preço)
        if (respostaBot.includes('R$') && produtosComImagem.length > 0) {
            const primeiroPreco = produtosComImagem[0].preco
            onOrcamentoEnviado(conversaId, primeiroPreco).catch(err =>
                console.error('Erro no trigger onOrcamentoEnviado:', err)
            )
        }

        // Trigger: lead perdido (se é encerramento)
        if (isEncerramento(conteudo)) {
            onLeadPerdido(conversaId, 'cliente_resolveu').catch(err =>
                console.error('Erro no trigger onLeadPerdido:', err)
            )
        }

        // Enviar imagem do primeiro produto (se disponível) — máximo 1 por resposta
        if (produtosComImagem.length > 0) {
            const produto = produtosComImagem[0]
            if (produto.imagemUrl) {
                const caption = `🛞 *${produto.nome}* — R$ ${produto.preco.toFixed(2)} | Instalação inclusa`
                try {
                    await whatsapp.sendImage(telefone, produto.imagemUrl, caption)
                    console.log(`📸 Imagem enviada: ${produto.nome}`)
                } catch (err) {
                    console.error('Erro ao enviar imagem do produto:', err)
                }
            }
        }

    } catch (error) {
        console.error('❌ Erro ao processar mensagem async:', error)
    }
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

// POST - Receber mensagens (retorna 200 imediato, processa em background)
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

                        // Deduplicação: ignorar mensagens já processadas
                        if (mensagensProcessadas.has(messageId)) {
                            console.log(`🔁 Mensagem duplicada ignorada: ${messageId}`)
                            continue
                        }
                        marcarComoProcessada(messageId)

                        const nomeRaw = value.contacts?.[0]?.profile?.name || ''
                        const nomeContato = validarNomeContato(nomeRaw)

                        let conteudo = ''

                        // Processar diferentes tipos de mensagem
                        if (message.type === 'text') {
                            conteudo = message.text?.body || ''
                        } else if (message.type === 'audio') {
                            const audioId = message.audio?.id
                            const mimeType = message.audio?.mime_type || 'audio/ogg'

                            if (audioId && isAudioSuportado(mimeType)) {
                                console.log(`🎤 Áudio recebido de ${nomeContato} (${telefone})`)

                                const resultado = await processarAudioWhatsApp(audioId, mimeType)
                                if (resultado.sucesso) {
                                    conteudo = resultado.texto
                                    console.log(`✅ Áudio transcrito: "${conteudo.substring(0, 100)}..."`)
                                } else {
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
                            await whatsapp.sendMessage(
                                telefone,
                                'Recebi sua mídia! Por enquanto só consigo processar textos e áudios. Pode me contar por escrito o que precisa? 😊'
                            )
                            continue
                        } else {
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

                        // Salvar mensagem no banco (síncrono, antes de retornar 200)
                        const { conversa } = await salvarMensagemRecebida(
                            telefone,
                            nomeContato,
                            conteudo,
                            messageId
                        )

                        // Aguardar processamento da IA antes de retornar
                        // (Vercel mata a function após enviar o response)
                        await processarMensagemAsync(
                            telefone,
                            nomeContato,
                            conteudo,
                            messageId,
                            conversa.id,
                        )
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
        // Retorna 200 mesmo em erro para evitar retries do Meta
        return NextResponse.json({ success: true })
    }
}
