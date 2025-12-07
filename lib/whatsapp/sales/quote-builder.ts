import { db } from '../../db'
import { LOJA_SLUG } from '../../constants'
import { Orcamento, ProdutoRecomendado } from '../types'
import { verificarDisponibilidade } from './stock-check'
// Gerar ID simples para orçamentos
function gerarIdOrcamento(): string {
    return `ORC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
}

// Valores de serviços (podem ser configuráveis no futuro)
const SERVICOS = {
    instalacaoPorPneu: 0, // Instalação inclusa no preço
    alinhamento: 0, // Alinhamento incluso
    balanceamento: 0, // Balanceamento incluso
}

// Cache de orçamentos (em produção usar Redis)
const orcamentosCache = new Map<string, Orcamento>()

export interface ItemOrcamento {
    produtoId: string
    quantidade: number
}

// Cria um orçamento baseado nos produtos selecionados
export async function criarOrcamento(
    items: ItemOrcamento[],
    telefoneCliente: string
): Promise<Orcamento | null> {
    try {
        // Busca produtos
        const produtoIds = items.map((i) => i.produtoId)
        const produtos = await db.produto.findMany({
            where: { id: { in: produtoIds } },
        })

        if (produtos.length === 0) {
            return null
        }

        // Verifica disponibilidade e calcula valores
        const itensOrcamento: Orcamento['produtos'] = []
        let subtotal = 0

        for (const item of items) {
            const produto = produtos.find((p) => p.id === item.produtoId)
            if (!produto) continue

            const disponibilidade = await verificarDisponibilidade(
                item.produtoId,
                item.quantidade
            )

            if (!disponibilidade.disponivel) {
                console.warn(`Produto ${produto.nome} sem estoque suficiente`)
                continue
            }

            const precoUnit = Number(produto.preco)
            const itemSubtotal = precoUnit * item.quantidade

            itensOrcamento.push({
                produtoId: produto.id,
                nome: produto.nome,
                quantidade: item.quantidade,
                precoUnit,
                subtotal: itemSubtotal,
            })

            subtotal += itemSubtotal
        }

        if (itensOrcamento.length === 0) {
            return null
        }

        // Calcula serviços
        const totalPneus = itensOrcamento.reduce((acc, i) => acc + i.quantidade, 0)
        const servicos = {
            instalacao: SERVICOS.instalacaoPorPneu * totalPneus,
            alinhamento: SERVICOS.alinhamento,
            balanceamento: SERVICOS.balanceamento,
        }

        const totalServicos = servicos.instalacao + servicos.alinhamento + servicos.balanceamento
        const total = subtotal + totalServicos

        // Cria orçamento
        const orcamento: Orcamento = {
            id: gerarIdOrcamento(),
            produtos: itensOrcamento,
            subtotal,
            servicos,
            total,
            validade: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        }

        // Salva no cache
        orcamentosCache.set(orcamento.id, orcamento)

        return orcamento
    } catch (error) {
        console.error('Erro ao criar orçamento:', error)
        return null
    }
}

// Cria orçamento rápido para 4 pneus do mesmo tipo
export async function criarOrcamentoRapido(
    produtoId: string,
    telefoneCliente: string
): Promise<Orcamento | null> {
    return criarOrcamento(
        [{ produtoId, quantidade: 4 }],
        telefoneCliente
    )
}

// Busca orçamento pelo ID
export function buscarOrcamento(orcamentoId: string): Orcamento | null {
    const orcamento = orcamentosCache.get(orcamentoId)

    if (!orcamento) return null

    // Verifica validade
    if (new Date() > orcamento.validade) {
        orcamentosCache.delete(orcamentoId)
        return null
    }

    return orcamento
}

// Formata orçamento para WhatsApp
export function formatarOrcamentoWhatsApp(orcamento: Orcamento): string {
    let texto = '📋 *ORÇAMENTO NENEM PNEUS*\n'
    texto += '━━━━━━━━━━━━━━━━━━━━━\n\n'

    // Produtos
    texto += '*Produtos:*\n'
    for (const item of orcamento.produtos) {
        texto += `• ${item.quantidade}x ${item.nome}\n`
        texto += `  R$ ${item.precoUnit.toFixed(2)} cada = R$ ${item.subtotal.toFixed(2)}\n`
    }

    texto += '\n'

    // Serviços inclusos
    texto += '*✅ Serviços inclusos:*\n'
    texto += '• Instalação\n'
    texto += '• Alinhamento\n'
    texto += '• Balanceamento\n\n'

    // Total
    texto += '━━━━━━━━━━━━━━━━━━━━━\n'
    texto += `*💰 TOTAL: R$ ${orcamento.total.toFixed(2)}*\n`
    texto += '━━━━━━━━━━━━━━━━━━━━━\n\n'

    // Validade
    const validadeFormatada = orcamento.validade.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
    texto += `⏰ Válido até: ${validadeFormatada}\n\n`

    // Formas de pagamento
    texto += '*Formas de pagamento:*\n'
    texto += '💳 Cartão em até 12x\n'
    texto += '📲 PIX com 5% de desconto\n'

    return texto
}

// Formata orçamento resumido (para conversas)
export function formatarOrcamentoResumido(orcamento: Orcamento): string {
    const totalPneus = orcamento.produtos.reduce((acc, i) => acc + i.quantidade, 0)
    const nomeProduto = orcamento.produtos[0]?.nome || 'Pneus'

    let texto = `🛞 *${totalPneus}x ${nomeProduto}*\n`
    texto += `💰 *R$ ${orcamento.total.toFixed(2)}*\n`
    texto += `✅ Inclui instalação, alinhamento e balanceamento`

    return texto
}

// Calcula valor com diferentes formas de pagamento
export function calcularValorPagamento(
    total: number,
    formaPagamento: 'pix' | 'cartao',
    parcelas?: number
): {
    valorFinal: number
    desconto?: number
    parcelas?: number
    valorParcela?: number
} {
    if (formaPagamento === 'pix') {
        const desconto = total * 0.05 // 5% de desconto
        return {
            valorFinal: total - desconto,
            desconto,
        }
    }

    // Cartão
    const numParcelas = parcelas || 1
    const valorParcela = total / numParcelas

    return {
        valorFinal: total,
        parcelas: numParcelas,
        valorParcela,
    }
}

// Formata opções de pagamento para WhatsApp
export function formatarOpcoesPagamento(total: number): string {
    const pix = calcularValorPagamento(total, 'pix')
    const cartao12x = calcularValorPagamento(total, 'cartao', 12)

    let texto = '*💳 Formas de pagamento:*\n\n'

    texto += `📲 *PIX:* R$ ${pix.valorFinal.toFixed(2)}\n`
    texto += `   (economia de R$ ${pix.desconto?.toFixed(2)}!)\n\n`

    texto += `💳 *Cartão à vista:* R$ ${total.toFixed(2)}\n\n`

    texto += `💳 *Cartão parcelado:*\n`
    texto += `   12x de R$ ${cartao12x.valorParcela?.toFixed(2)}\n`

    return texto
}

// Gera mensagem de valor percebido (técnica de vendas)
export function gerarMensagemValorPercebido(orcamento: Orcamento): string {
    const totalPneus = orcamento.produtos.reduce((acc, i) => acc + i.quantidade, 0)

    // Valores fictícios de mercado para comparação
    const valorInstalacaoMercado = 40 * totalPneus // R$ 40 por pneu
    const valorAlinhamentoMercado = 80
    const valorBalanceamentoMercado = 60

    const economiaTeorica = valorInstalacaoMercado + valorAlinhamentoMercado + valorBalanceamentoMercado

    let texto = `💡 *Você está economizando R$ ${economiaTeorica.toFixed(2)}!*\n\n`
    texto += `Em outras lojas você pagaria:\n`
    texto += `• Instalação: R$ ${valorInstalacaoMercado.toFixed(2)}\n`
    texto += `• Alinhamento: R$ ${valorAlinhamentoMercado.toFixed(2)}\n`
    texto += `• Balanceamento: R$ ${valorBalanceamentoMercado.toFixed(2)}\n\n`
    texto += `Aqui na Nenem Pneus está *tudo incluso* no preço! 😊`

    return texto
}
