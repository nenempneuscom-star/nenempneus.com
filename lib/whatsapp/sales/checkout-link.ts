import { db } from '../../db'
import { LOJA_SLUG } from '../../constants'
import { Orcamento } from '../types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nenempneus.com'

// Cache de carrinhos temporários (telefone -> produtos)
const carrinhosTemp = new Map<string, {
    produtos: Array<{ id: string; quantidade: number }>
    criadoEm: Date
}>()

// Gera link para adicionar produtos ao carrinho
export function gerarLinkCarrinho(
    produtos: Array<{ id: string; quantidade: number }>
): string {
    // Formato: /carrinho?add=id1:qtd1,id2:qtd2
    const params = produtos
        .map((p) => `${p.id}:${p.quantidade}`)
        .join(',')

    return `${BASE_URL}/carrinho?add=${encodeURIComponent(params)}`
}

// Gera link direto para checkout com produtos pré-selecionados
export function gerarLinkCheckout(
    produtos: Array<{ id: string; quantidade: number }>
): string {
    const params = produtos
        .map((p) => `${p.id}:${p.quantidade}`)
        .join(',')

    return `${BASE_URL}/checkout?produtos=${encodeURIComponent(params)}`
}

// Gera link de checkout a partir de um orçamento
export function gerarLinkOrcamento(orcamento: Orcamento): string {
    const produtos = orcamento.produtos.map((p) => ({
        id: p.produtoId,
        quantidade: p.quantidade,
    }))

    return gerarLinkCheckout(produtos)
}

// Salva carrinho temporário para um telefone
export function salvarCarrinhoTemp(
    telefone: string,
    produtos: Array<{ id: string; quantidade: number }>
): void {
    carrinhosTemp.set(telefone, {
        produtos,
        criadoEm: new Date(),
    })

    // Limpa carrinhos antigos (mais de 24h)
    limparCarrinhosAntigos()
}

// Recupera carrinho temporário
export function recuperarCarrinhoTemp(
    telefone: string
): Array<{ id: string; quantidade: number }> | null {
    const carrinho = carrinhosTemp.get(telefone)

    if (!carrinho) return null

    // Verifica se não expirou (24h)
    const agora = new Date()
    const diff = agora.getTime() - carrinho.criadoEm.getTime()
    const horas = diff / (1000 * 60 * 60)

    if (horas > 24) {
        carrinhosTemp.delete(telefone)
        return null
    }

    return carrinho.produtos
}

// Limpa carrinhos antigos
function limparCarrinhosAntigos(): void {
    const agora = new Date()

    for (const [telefone, carrinho] of carrinhosTemp.entries()) {
        const diff = agora.getTime() - carrinho.criadoEm.getTime()
        const horas = diff / (1000 * 60 * 60)

        if (horas > 24) {
            carrinhosTemp.delete(telefone)
        }
    }
}

// Gera link curto (usando o número do orçamento como referência)
export function gerarLinkCurto(orcamentoId: string): string {
    // Por simplicidade, usamos o ID direto
    // Em produção, poderia usar um serviço de shortening
    return `${BASE_URL}/orcamento/${orcamentoId}`
}

// Formata mensagem com link de checkout
export function formatarMensagemCheckout(
    orcamento: Orcamento,
    nomeCliente?: string
): string {
    const link = gerarLinkOrcamento(orcamento)
    const saudacao = nomeCliente ? `${nomeCliente}, ` : ''

    let texto = `${saudacao}seu orçamento está pronto! 🎉\n\n`

    // Resumo do orçamento
    const totalPneus = orcamento.produtos.reduce((acc, i) => acc + i.quantidade, 0)
    texto += `🛞 ${totalPneus} pneu${totalPneus > 1 ? 's' : ''}\n`
    texto += `💰 Total: R$ ${orcamento.total.toFixed(2)}\n`
    texto += `✅ Instalação, alinhamento e balanceamento inclusos\n\n`

    // Link
    texto += `👉 Clique para finalizar:\n${link}\n\n`

    // PIX
    const valorPix = orcamento.total * 0.95
    texto += `💡 No PIX você paga apenas R$ ${valorPix.toFixed(2)}!`

    return texto
}

// Formata mensagem com botão de ação
export function formatarMensagemComBotao(
    orcamento: Orcamento
): {
    texto: string
    botoes: Array<{ id: string; titulo: string }>
} {
    let texto = '🛒 Pronto para finalizar?\n\n'

    const totalPneus = orcamento.produtos.reduce((acc, i) => acc + i.quantidade, 0)
    texto += `${totalPneus} pneu${totalPneus > 1 ? 's' : ''} - R$ ${orcamento.total.toFixed(2)}\n`
    texto += 'Instalação inclusa!'

    return {
        texto,
        botoes: [
            { id: `comprar_${orcamento.id}`, titulo: '✅ Quero comprar' },
            { id: `duvida_${orcamento.id}`, titulo: '❓ Tenho dúvida' },
            { id: 'ver_outros', titulo: '🔄 Ver outros' },
        ],
    }
}

// Verifica se cliente tem pedido recente (para evitar duplicação)
export async function verificarPedidoRecente(
    telefone: string,
    horasLimite: number = 2
): Promise<boolean> {
    try {
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) return false

        const cliente = await db.cliente.findFirst({
            where: {
                lojaId: loja.id,
                telefone: { contains: telefone.replace(/\D/g, '') },
            },
        })

        if (!cliente) return false

        const dataLimite = new Date()
        dataLimite.setHours(dataLimite.getHours() - horasLimite)

        const pedidoRecente = await db.pedido.findFirst({
            where: {
                clienteId: cliente.id,
                createdAt: { gte: dataLimite },
            },
        })

        return !!pedidoRecente
    } catch (error) {
        console.error('Erro ao verificar pedido recente:', error)
        return false
    }
}

// Gera mensagem de urgência para fechamento
export function gerarMensagemUrgencia(orcamento: Orcamento): string {
    const horasRestantes = Math.ceil(
        (orcamento.validade.getTime() - Date.now()) / (1000 * 60 * 60)
    )

    if (horasRestantes <= 1) {
        return '⚠️ *Última hora!* Este orçamento expira em breve. Garanta já o seu!'
    }

    if (horasRestantes <= 6) {
        return `⏰ Seu orçamento é válido por mais ${horasRestantes} horas. Não perca!`
    }

    return '✅ Orçamento válido por 24 horas.'
}
