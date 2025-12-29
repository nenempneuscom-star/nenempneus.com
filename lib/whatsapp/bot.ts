import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, construirPromptContexto, PROMPTS_SITUACIONAIS, RESPOSTAS_OBJECOES } from './prompts'
import { db } from '../db'
import { getCachedResponse, setCachedResponse, getQuickResponse } from './cache'

// Tipo de retorno para resposta (mantido para compatibilidade)
export interface RespostaBotComImagens {
    texto: string
    produtosComImagem: Array<{
        nome: string
        preco: number
        imageUrl: string
        estoque: number
    }>
}

// Usar placeholder temporário se não configurado (para build)
const apiKey = process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder-temp'

const anthropic = new Anthropic({
    apiKey: apiKey,
})

// Cache de contexto de conversa (telefone -> contexto)
const conversaContexto = new Map<string, {
    etapaConversa: 'novo' | 'conversando'
}>()

// Palavras-chave para detecção de situações comuns
const SITUACOES_KEYWORDS: Record<string, string[]> = {
    'preco': ['preço', 'preco', 'quanto', 'valor', 'custa', 'custo'],
    'caro': ['caro', 'muito caro', 'preço alto', 'puxado', 'salgado'],
    'pensar': ['vou pensar', 'deixa eu pensar', 'preciso pensar', 'vou ver'],
    'depois': ['depois', 'outra hora', 'outro dia', 'mais tarde', 'não agora'],
    'golpe': ['golpe', 'é golpe', 'parece golpe', 'fake', 'falso', 'fraude', 'pilantra', 'enganação'],
    'confiavel': ['confiável', 'confiavel', 'é seguro', 'posso confiar', 'é verdade', 'é real', 'existe mesmo', 'loja de verdade'],
}

// Detecta situação na mensagem
function detectarSituacao(mensagem: string): string | null {
    const msgLower = mensagem.toLowerCase()

    for (const [tipo, keywords] of Object.entries(SITUACOES_KEYWORDS)) {
        for (const keyword of keywords) {
            if (msgLower.includes(keyword)) {
                return tipo
            }
        }
    }

    return null
}

// Busca ou cria contexto da conversa
function getContexto(telefone: string) {
    if (!conversaContexto.has(telefone)) {
        conversaContexto.set(telefone, {
            etapaConversa: 'novo',
        })
    }
    return conversaContexto.get(telefone)!
}

// Gera resposta do bot atendente
export async function gerarRespostaBot(
    conversaId: string,
    nomeCliente: string,
    mensagem: string,
    telefone?: string
): Promise<string> {
    try {
        const tel = telefone || ''
        const ctx = getContexto(tel)

        // 1. Verificar se é situação conhecida (resposta rápida)
        const situacao = detectarSituacao(mensagem)
        if (situacao && RESPOSTAS_OBJECOES[situacao]) {
            console.log(`⚡ Resposta para situação: ${situacao}`)
            return RESPOSTAS_OBJECOES[situacao]
        }

        // 2. Verificar FAQ (respostas instantâneas básicas)
        const respostaRapida = getQuickResponse(mensagem)
        if (respostaRapida && mensagem.length < 20) {
            console.log('⚡ Resposta rápida (FAQ)')

            // Se for saudação, usa boas-vindas personalizadas
            if (['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite'].includes(mensagem.toLowerCase().trim())) {
                const isNovaConversa = ctx.etapaConversa === 'novo'
                ctx.etapaConversa = 'conversando'
                if (isNovaConversa) {
                    return PROMPTS_SITUACIONAIS.boasVindas(nomeCliente)
                } else {
                    return PROMPTS_SITUACIONAIS.clienteRetornando(nomeCliente)
                }
            }

            return respostaRapida
        }

        // 3. Verificar cache de respostas similares
        const respostaCache = getCachedResponse(mensagem)
        if (respostaCache) {
            console.log('💾 Resposta do cache')
            return respostaCache
        }

        // 4. Buscar histórico recente da conversa
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

        // 5. Construir prompt com contexto
        const promptUsuario = construirPromptContexto(
            nomeCliente,
            mensagem,
            historico as any,
            {
                telefoneCliente: tel || undefined,
            }
        )

        // 6. Gerar resposta com IA
        console.log('🤖 Gerando resposta com Claude...')

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512, // Respostas mais curtas
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
            : 'Desculpe, não consegui processar sua mensagem. Um atendente vai te ajudar!'

        // 7. Salvar no cache
        setCachedResponse(mensagem, respostaBot)

        // 8. Marcar mensagens como processadas
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

        // Atualizar contexto
        ctx.etapaConversa = 'conversando'

        return respostaBot
    } catch (error) {
        console.error('Erro ao gerar resposta do bot:', error)
        return 'Opa, tive um probleminha técnico aqui. 😅 Mas calma que um atendente já vai te ajudar!'
    }
}

// Mantido para compatibilidade - agora retorna sempre sem imagens
export async function gerarRespostaBotComImagens(
    conversaId: string,
    nomeCliente: string,
    mensagem: string,
    telefone?: string
): Promise<RespostaBotComImagens> {
    const texto = await gerarRespostaBot(conversaId, nomeCliente, mensagem, telefone)
    return { texto, produtosComImagem: [] }
}

// Verifica se deve transferir para humano
export function verificarTransferenciaHumano(mensagem: string): boolean {
    const palavrasChave = [
        'atendente',
        'humano',
        'pessoa',
        'falar com alguém',
        'falar com alguem',
        'não entendi',
        'nao entendi',
        'gente',
        'operador',
        'gerente',
        'dono',
        'reclamação',
        'reclamacao',
        'problema sério',
        'problema serio',
        'insatisfeito',
        'muito irritado',
        'quero cancelar',
        'cancelar pedido',
    ]

    const mensagemLower = mensagem.toLowerCase()
    return palavrasChave.some((palavra) => mensagemLower.includes(palavra))
}

// Gera resposta de transferência
export function gerarRespostaTransferencia(): string {
    return 'Vou te conectar com nosso atendente agora! Um momento. 👨‍💼'
}

// Gera resposta de boas-vindas (primeira mensagem)
export function gerarBoasVindas(nome?: string): string {
    return PROMPTS_SITUACIONAIS.boasVindas(nome || '')
}

// Gera follow-up para leads
export function gerarFollowUp(nome: string, contexto: 'orcamento' | 'interesse' | 'abandonou'): string {
    switch (contexto) {
        case 'orcamento':
        case 'interesse':
            return `Oi${nome ? `, ${nome}` : ''}! 😊

Vi que você tava interessado em pneus. Dá uma olhada no nosso site que lá tem tudo atualizado: https://nenempneus.com

Se tiver dúvida, é só me chamar!`

        case 'abandonou':
            return `Oi${nome ? `, ${nome}` : ''}!

Posso te ajudar com alguma coisa? Nosso site tá sempre atualizado: https://nenempneus.com 😊`

        default:
            return `Oi${nome ? `, ${nome}` : ''}! Como posso te ajudar hoje?`
    }
}
