import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, construirPromptContexto } from './prompts'
import { db } from '../db'
import { getCachedResponse, setCachedResponse, getQuickResponse } from './cache'

// Usar placeholder temporário se não configurado (para build)
const apiKey = process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder-temp'

const anthropic = new Anthropic({
    apiKey: apiKey,
})

export async function gerarRespostaBot(
    conversaId: string,
    nomeCliente: string,
    mensagem: string
): Promise<string> {
    try {
        // 1. Verificar FAQ (respostas instantâneas)
        const respostaRapida = getQuickResponse(mensagem)
        if (respostaRapida) {
            console.log('⚡ Resposta rápida (FAQ)')
            return respostaRapida
        }

        // 2. Verificar cache
        const respostaCache = getCachedResponse(mensagem)
        if (respostaCache) {
            console.log('💾 Resposta do cache')
            return respostaCache
        }

        // 3. Gerar com IA
        console.log('🤖 Gerando resposta com Claude...')

        // Buscar histórico recente da conversa
        const mensagensAnteriores = await db.mensagemWhatsApp.findMany({
            where: { conversaId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        })

        // Converter para formato Claude
        const historico = mensagensAnteriores.reverse().map((msg) => ({
            role: msg.direcao === 'entrada' ? 'user' : 'assistant',
            content: msg.conteudo,
        }))

        // Construir prompt com contexto
        const promptUsuario = construirPromptContexto(
            nomeCliente,
            mensagem,
            historico as any
        )

        // Chamar Claude API
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: promptUsuario,
                },
            ],
        })

        // Extrair resposta
        const respostaBot = response.content[0].type === 'text'
            ? response.content[0].text
            : 'Desculpe, não consegui processar sua mensagem.'

        // Salvar no cache
        setCachedResponse(mensagem, respostaBot)

        // Marcar mensagem como processada por IA
        await db.mensagemWhatsApp.updateMany({
            where: {
                conversaId,
                direcao: 'entrada',
                processadoPorIa: false,
            },
            data: {
                processadoPorIa: true,
            },
        })

        return respostaBot
    } catch (error) {
        console.error('Erro ao gerar resposta do bot:', error)
        return 'Desculpe, estou com problemas técnicos no momento. Um atendente entrará em contato em breve. 😊'
    }
}

export function verificarTransferenciaHumano(mensagem: string): boolean {
    const palavrasChave = [
        'atendente',
        'humano',
        'pessoa',
        'falar com alguém',
        'não entendi',
        'gente',
        'operador',
    ]

    const mensagemLower = mensagem.toLowerCase()
    return palavrasChave.some((palavra) => mensagemLower.includes(palavra))
}
