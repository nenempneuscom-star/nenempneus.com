import { PROMPTS_SITUACIONAIS, RESPOSTAS_OBJECOES } from './prompts'
import { db } from '../db'
import { getQuickResponse } from './cache'

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

// Cache de contexto de conversa (telefone -> contexto)
const conversaContexto = new Map<string, {
    etapaConversa: 'novo' | 'conversando'
}>()

// Palavras-chave para detecção de situações comuns
const SITUACOES_KEYWORDS: Record<string, string[]> = {
    'preco': ['preço', 'preco', 'quanto', 'valor', 'custa', 'custo', 'tabela', 'valores'],
    'caro': ['caro', 'muito caro', 'preço alto', 'puxado', 'salgado'],
    'pensar': ['vou pensar', 'deixa eu pensar', 'preciso pensar', 'vou ver'],
    'depois': ['depois', 'outra hora', 'outro dia', 'mais tarde', 'não agora'],
    'golpe': ['golpe', 'é golpe', 'parece golpe', 'fake', 'falso', 'fraude', 'pilantra', 'enganação'],
    'confiavel': ['confiável', 'confiavel', 'é seguro', 'posso confiar', 'é verdade', 'é real', 'existe mesmo', 'loja de verdade'],
    'horario': ['horário', 'horario', 'que horas', 'hora funciona', 'hora abre', 'hora fecha', 'aberto', 'fechado', 'funciona', 'abre', 'fecha'],
    'agendar': ['agendar', 'agendamento', 'marcar', 'reservar', 'hora marcada'],
    'reparo': ['reparo', 'reparar', 'conserto', 'consertar', 'furou', 'furo', 'remendo', 'remendar', 'vazando', 'murchando', 'murcho'],
    'moto': ['moto', 'motocicleta', 'motinha', 'duas rodas', 'honda', 'yamaha', 'suzuki', 'kawasaki', 'bmw moto', 'fazer', 'cg', 'biz', 'pcx', 'xre', 'cb', 'bros', 'factor', 'crosser', 'lander', 'tenere', 'pop'],
    'localizacao': ['onde fica', 'endereço', 'endereco', 'localização', 'localizacao', 'como chego', 'mapa', 'rua', 'avenida'],
    'pagamento': ['pagamento', 'pagar', 'parcela', 'parcelas', 'pix', 'cartão', 'cartao', 'dinheiro', 'débito', 'debito', 'crédito', 'credito'],
    'medida': ['medida', 'tamanho', 'aro', 'r14', 'r15', 'r16', 'r17', 'r18', '175', '185', '195', '205', '215', '225'],
    'disponibilidade': ['tem', 'disponível', 'disponivel', 'estoque', 'ainda tem', 'vocês tem', 'voces tem'],
    'obrigado': ['obrigado', 'obrigada', 'valeu', 'vlw', 'agradeço', 'agradeco', 'thanks', 'brigado', 'brigada'],
}

// Respostas adicionais que não estão no prompts.ts
const RESPOSTAS_ADICIONAIS: Record<string, string> = {
    'localizacao': `📍 Estamos na *Av. Nereu Ramos, 740* - Centro, Capivari de Baixo - SC.

Somos loja física, pode vir conhecer! 😊

*Horário:*
Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h`,

    'pagamento': `Aceitamos várias formas de pagamento! 💳

✅ *PIX* (à vista)
✅ *Cartão* em até 12x
✅ *Dinheiro*

Dá uma olhada no site pra ver os preços: https://nenempneus.com`,

    'medida': `A medida do pneu fica na *lateral do pneu*! 🛞

Pra carro é tipo: *175/70 R14*
Pra moto é tipo: *100/80-17*

Se não conseguir ver, me fala o modelo do veículo que te ajudo!`,

    'disponibilidade': `Nosso estoque muda toda semana! 📦

Dá uma olhada no site que lá tem tudo atualizado com *foto real* de cada pneu: https://nenempneus.com/produtos

Se não encontrar a medida, me avisa que verifico se temos previsão de chegada! 😊`,

    'obrigado': `Por nada! 😊

Se precisar de mais alguma coisa, é só chamar!

Nosso site: https://nenempneus.com`,
}

// Resposta genérica para quando não identificar a intenção
const RESPOSTA_GENERICA = `Oi! Sou a Cinthia, da Nenem Pneus! 😊

Posso te ajudar com:
🛞 Pneus pra carro (seminovos)
🏍️ Pneus pra moto (novos)
🔧 Serviços (instalação, alinhamento, balanceamento)

Dá uma olhada no nosso site que tem tudo com foto e preço: https://nenempneus.com

Me conta, o que você precisa?`

// Detecta situação na mensagem
function detectarSituacao(mensagem: string): string | null {
    const msgLower = mensagem.toLowerCase()

    // Prioridade alta
    const prioridadeAlta = ['reparo', 'agendar', 'horario', 'moto', 'localizacao', 'obrigado']
    for (const tipo of prioridadeAlta) {
        const keywords = SITUACOES_KEYWORDS[tipo]
        if (keywords) {
            for (const keyword of keywords) {
                if (msgLower.includes(keyword)) {
                    return tipo
                }
            }
        }
    }

    // Depois verificar as demais situações
    for (const [tipo, keywords] of Object.entries(SITUACOES_KEYWORDS)) {
        if (prioridadeAlta.includes(tipo)) continue
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

// Obtém resposta para uma situação
function obterResposta(situacao: string): string | null {
    // Primeiro verifica nas respostas de objeções (prompts.ts)
    if (RESPOSTAS_OBJECOES[situacao]) {
        return RESPOSTAS_OBJECOES[situacao]
    }
    // Depois nas respostas adicionais
    if (RESPOSTAS_ADICIONAIS[situacao]) {
        return RESPOSTAS_ADICIONAIS[situacao]
    }
    return null
}

// Gera resposta do bot atendente - SEM IA, apenas respostas pré-definidas
export async function gerarRespostaBot(
    conversaId: string,
    nomeCliente: string,
    mensagem: string,
    telefone?: string
): Promise<string> {
    try {
        const tel = telefone || ''
        const ctx = getContexto(tel)
        const msgLower = mensagem.toLowerCase().trim()

        // 1. Verificar saudação
        const saudacoes = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'eae', 'e aí', 'eai', 'hey', 'hello', 'salve']
        if (saudacoes.some(s => msgLower === s || msgLower.startsWith(s + ' ') || msgLower.startsWith(s + ','))) {
            const isNovaConversa = ctx.etapaConversa === 'novo'
            ctx.etapaConversa = 'conversando'
            console.log('⚡ Saudação detectada')
            if (isNovaConversa) {
                return PROMPTS_SITUACIONAIS.boasVindas(nomeCliente)
            } else {
                return PROMPTS_SITUACIONAIS.clienteRetornando(nomeCliente)
            }
        }

        // 2. Verificar se é situação conhecida
        const situacao = detectarSituacao(mensagem)
        if (situacao) {
            const resposta = obterResposta(situacao)
            if (resposta) {
                console.log(`⚡ Resposta para situação: ${situacao}`)
                ctx.etapaConversa = 'conversando'
                return resposta
            }
        }

        // 3. Verificar FAQ (respostas instantâneas básicas)
        const respostaRapida = getQuickResponse(mensagem)
        if (respostaRapida) {
            console.log('⚡ Resposta rápida (FAQ)')
            ctx.etapaConversa = 'conversando'
            return respostaRapida
        }

        // 4. Marcar mensagens como processadas
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

        // 5. Resposta genérica (sem chamar IA)
        console.log('📝 Resposta genérica (sem IA)')
        ctx.etapaConversa = 'conversando'
        return RESPOSTA_GENERICA

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
