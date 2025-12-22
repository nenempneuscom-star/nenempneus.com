import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, construirPromptContexto, PROMPTS_SITUACIONAIS, RESPOSTAS_OBJECOES } from './prompts'
import { db } from '../db'
import { getCachedResponse, setCachedResponse, getQuickResponse } from './cache'
import {
    extrairInfoVeiculo,
    buscarProdutos,
    buscarProdutosParaVeiculo,
    formatarListaProdutosWhatsApp,
} from './sales/product-search'
import {
    criarOrcamentoRapido,
    formatarOrcamentoWhatsApp,
} from './sales/quote-builder'
import {
    gerarLinkOrcamento,
} from './sales/checkout-link'
import {
    buscarProximosHorarios,
    formatarSlotsWhatsApp,
} from './sales/appointment'

// Usar placeholder temporário se não configurado (para build)
const apiKey = process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder-temp'

const anthropic = new Anthropic({
    apiKey: apiKey,
})

// Cache de contexto de conversa (telefone -> contexto)
const conversaContexto = new Map<string, {
    veiculo?: { marca?: string; modelo?: string; ano?: number; medida?: string }
    ultimaIntencao?: string
    produtosVistos?: string[]
    orcamentoId?: string
    etapaFunil: 'novo' | 'qualificando' | 'apresentando' | 'orcamento' | 'fechando'
}>()

// Palavras-chave para detecção de objeções
const OBJECOES_KEYWORDS: Record<string, string[]> = {
    'caro': ['caro', 'muito caro', 'preço alto', 'puxado', 'salgado'],
    'pensar': ['vou pensar', 'deixa eu pensar', 'preciso pensar', 'vou ver'],
    'pesquisando': ['só pesquisando', 'to pesquisando', 'só olhando', 'to olhando', 'pesquisa'],
    'outro_lugar': ['outro lugar', 'outra loja', 'ver em outro', 'concorrente'],
    'sem_dinheiro': ['sem dinheiro', 'não tenho', 'tá difícil', 'apertado', 'sem grana'],
    'depois': ['depois', 'outra hora', 'outro dia', 'mais tarde', 'não agora'],
}

// Detecta objeção na mensagem
function detectarObjecao(mensagem: string): string | null {
    const msgLower = mensagem.toLowerCase()

    for (const [tipo, keywords] of Object.entries(OBJECOES_KEYWORDS)) {
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
            etapaFunil: 'novo',
        })
    }
    return conversaContexto.get(telefone)!
}

// Atualiza contexto da conversa
function atualizarContexto(telefone: string, updates: Partial<ReturnType<typeof getContexto>>) {
    const ctx = getContexto(telefone)
    Object.assign(ctx, updates)
}

// Gera resposta do bot vendedor
export async function gerarRespostaBot(
    conversaId: string,
    nomeCliente: string,
    mensagem: string,
    telefone?: string
): Promise<string> {
    try {
        const tel = telefone || ''
        const ctx = getContexto(tel)

        // 1. Verificar se é objeção conhecida (resposta rápida)
        const objecao = detectarObjecao(mensagem)
        if (objecao && RESPOSTAS_OBJECOES[objecao]) {
            console.log(`⚡ Resposta para objeção: ${objecao}`)
            return RESPOSTAS_OBJECOES[objecao]
        }

        // 2. Verificar FAQ (respostas instantâneas básicas)
        const respostaRapida = getQuickResponse(mensagem)
        if (respostaRapida && mensagem.length < 20) {
            console.log('⚡ Resposta rápida (FAQ)')

            // Se for saudação, usa boas-vindas personalizadas
            if (['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite'].includes(mensagem.toLowerCase().trim())) {
                const isNovaConversa = ctx.etapaFunil === 'novo'
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

        // 4. Extrair informações do veículo
        const infoVeiculo = extrairInfoVeiculo(mensagem)
        if (infoVeiculo.modelo || infoVeiculo.medida) {
            atualizarContexto(tel, {
                veiculo: { ...ctx.veiculo, ...infoVeiculo },
                etapaFunil: 'qualificando',
            })
        }

        // 5. Buscar produtos se tiver info do veículo
        let produtosTexto = ''
        let produtos: Awaited<ReturnType<typeof buscarProdutos>> = []

        if (ctx.veiculo?.modelo || ctx.veiculo?.medida || infoVeiculo.modelo || infoVeiculo.medida) {
            const modelo = ctx.veiculo?.modelo || infoVeiculo.modelo
            const medida = ctx.veiculo?.medida || infoVeiculo.medida

            if (medida) {
                produtos = await buscarProdutos({ medida, limite: 4 })
            } else if (modelo) {
                produtos = await buscarProdutosParaVeiculo(modelo, { limite: 4 })
            }

            if (produtos.length > 0) {
                produtosTexto = formatarListaProdutosWhatsApp(produtos)
                atualizarContexto(tel, { etapaFunil: 'apresentando' })
            }
        }

        // 6. Verificar se está pedindo orçamento/preço
        const querOrcamento = /orcamento|orçamento|preço|preco|quanto custa|valor|quanto fica/i.test(mensagem)
        let orcamentoTexto = ''

        if (querOrcamento && produtos.length > 0) {
            const orcamento = await criarOrcamentoRapido(produtos[0].id, tel)
            if (orcamento) {
                orcamentoTexto = formatarOrcamentoWhatsApp(orcamento)
                atualizarContexto(tel, {
                    orcamentoId: orcamento.id,
                    etapaFunil: 'orcamento',
                })
            }
        }

        // 7. Verificar se quer agendar
        const querAgendar = /agendar|agenda|instalar|instalação|horario|horário|marcar/i.test(mensagem)
        let horariosTexto = ''

        if (querAgendar) {
            const horarios = await buscarProximosHorarios(6)
            horariosTexto = formatarSlotsWhatsApp(horarios)
            atualizarContexto(tel, { etapaFunil: 'fechando' })
        }

        // 8. Buscar histórico recente da conversa
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

        // 9. Construir prompt com contexto completo
        const promptUsuario = construirPromptContexto(
            nomeCliente,
            mensagem,
            historico as any,
            {
                produtosDisponiveis: produtosTexto || undefined,
                orcamentoAtivo: orcamentoTexto || undefined,
                horariosDisponiveis: horariosTexto || undefined,
                infoVeiculo: ctx.veiculo ? JSON.stringify(ctx.veiculo) : undefined,
                telefoneCliente: tel || undefined,
            }
        )

        // 10. Gerar resposta com IA
        console.log('🤖 Gerando resposta com Claude...')

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
        let respostaBot = response.content[0].type === 'text'
            ? response.content[0].text
            : 'Desculpe, não consegui processar sua mensagem. Um atendente vai te ajudar!'

        // 11. Se tiver orçamento pronto e cliente demonstrou interesse, adicionar link
        if (ctx.orcamentoId && ctx.etapaFunil === 'fechando') {
            const orcamentoSalvo = await criarOrcamentoRapido(produtos[0]?.id || '', tel)
            if (orcamentoSalvo) {
                const linkCheckout = gerarLinkOrcamento(orcamentoSalvo)
                respostaBot += `\n\n👉 *Finalizar compra:* ${linkCheckout}`
            }
        }

        // 12. Salvar no cache
        setCachedResponse(mensagem, respostaBot)

        // 13. Marcar mensagens como processadas
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
        return 'Opa, tive um probleminha técnico aqui. 😅 Mas calma que um atendente já vai te ajudar!'
    }
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
    return 'Vou te conectar com nosso especialista agora mesmo! Um momento. 👨‍💼'
}

// Gera resposta de boas-vindas (primeira mensagem)
export function gerarBoasVindas(nome?: string): string {
    return PROMPTS_SITUACIONAIS.boasVindas(nome || '')
}

// Gera follow-up para leads frios
export function gerarFollowUp(nome: string, contexto: 'orcamento' | 'interesse' | 'abandonou'): string {
    switch (contexto) {
        case 'orcamento':
            return `Oi${nome ? `, ${nome}` : ''}! 😊

Passando pra ver se ficou alguma dúvida sobre aquele orçamento.

Tô com horários disponíveis ainda essa semana. Posso reservar um pra você?`

        case 'interesse':
            return `E aí${nome ? `, ${nome}` : ''}!

Lembra que você tava vendo pneus pra trocar? Chegou uns modelos novos aqui que podem te interessar!

Quer dar uma olhada?`

        case 'abandonou':
            return `Oi${nome ? `, ${nome}` : ''}!

Vi que você não finalizou a compra. Aconteceu alguma coisa? Posso te ajudar com alguma dúvida?`

        default:
            return `Oi${nome ? `, ${nome}` : ''}! Como posso te ajudar hoje?`
    }
}
