import { db } from '../../db'
import { LOJA_SLUG } from '../../constants'

export interface EstoqueInfo {
    produtoId: string
    nome: string
    estoque: number
    disponivel: boolean
    previsaoReposicao?: string
}

// Verifica estoque de um produto específico
export async function verificarEstoque(produtoId: string): Promise<EstoqueInfo | null> {
    try {
        const produto = await db.produto.findUnique({
            where: { id: produtoId },
        })

        if (!produto) {
            return null
        }

        return {
            produtoId: produto.id,
            nome: produto.nome,
            estoque: produto.estoque,
            disponivel: produto.estoque > 0 && produto.ativo,
        }
    } catch (error) {
        console.error('Erro ao verificar estoque:', error)
        return null
    }
}

// Verifica estoque de múltiplos produtos
export async function verificarEstoqueMultiplo(
    produtoIds: string[]
): Promise<Map<string, EstoqueInfo>> {
    const resultado = new Map<string, EstoqueInfo>()

    try {
        const produtos = await db.produto.findMany({
            where: {
                id: { in: produtoIds },
            },
        })

        for (const produto of produtos) {
            resultado.set(produto.id, {
                produtoId: produto.id,
                nome: produto.nome,
                estoque: produto.estoque,
                disponivel: produto.estoque > 0 && produto.ativo,
            })
        }
    } catch (error) {
        console.error('Erro ao verificar estoque múltiplo:', error)
    }

    return resultado
}

// Verifica se há estoque suficiente para quantidade desejada
export async function verificarDisponibilidade(
    produtoId: string,
    quantidade: number
): Promise<{
    disponivel: boolean
    estoqueAtual: number
    faltam?: number
}> {
    try {
        const produto = await db.produto.findUnique({
            where: { id: produtoId },
        })

        if (!produto) {
            return {
                disponivel: false,
                estoqueAtual: 0,
                faltam: quantidade,
            }
        }

        const disponivel = produto.estoque >= quantidade && produto.ativo

        return {
            disponivel,
            estoqueAtual: produto.estoque,
            faltam: disponivel ? undefined : quantidade - produto.estoque,
        }
    } catch (error) {
        console.error('Erro ao verificar disponibilidade:', error)
        return {
            disponivel: false,
            estoqueAtual: 0,
            faltam: quantidade,
        }
    }
}

// Busca produtos com estoque baixo (para alertas)
export async function buscarEstoqueBaixo(limite: number = 5): Promise<EstoqueInfo[]> {
    try {
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) {
            return []
        }

        const produtos = await db.produto.findMany({
            where: {
                lojaId: loja.id,
                ativo: true,
                estoque: { lte: limite },
            },
            orderBy: { estoque: 'asc' },
        })

        return produtos.map((p) => ({
            produtoId: p.id,
            nome: p.nome,
            estoque: p.estoque,
            disponivel: p.estoque > 0,
        }))
    } catch (error) {
        console.error('Erro ao buscar estoque baixo:', error)
        return []
    }
}

// Reserva estoque (para quando cliente está no processo de compra)
// Nota: Implementação simplificada - em produção usar transações
export async function reservarEstoque(
    produtoId: string,
    quantidade: number
): Promise<boolean> {
    try {
        const produto = await db.produto.findUnique({
            where: { id: produtoId },
        })

        if (!produto || produto.estoque < quantidade) {
            return false
        }

        // Em um sistema real, teríamos uma tabela de reservas temporárias
        // Por enquanto, apenas verificamos se há estoque
        return true
    } catch (error) {
        console.error('Erro ao reservar estoque:', error)
        return false
    }
}

// Formata informação de estoque para WhatsApp
export function formatarEstoqueWhatsApp(info: EstoqueInfo): string {
    if (!info.disponivel) {
        return `❌ *${info.nome}*\n   Indisponível no momento`
    }

    const icone = info.estoque <= 3 ? '⚠️' : '✅'
    const urgencia = info.estoque <= 3 ? ' (últimas unidades!)' : ''

    return `${icone} *${info.nome}*\n   ${info.estoque} em estoque${urgencia}`
}

// Gera mensagem de escassez (técnica de vendas)
export function gerarMensagemEscassez(estoque: number, nome: string): string {
    if (estoque <= 2) {
        return `⚠️ Atenção: Temos apenas *${estoque}* unidade${estoque > 1 ? 's' : ''} de ${nome}. É um dos mais procurados!`
    }

    if (estoque <= 5) {
        return `📦 Temos *${estoque}* unidades de ${nome} disponíveis. Costuma sair rápido!`
    }

    return `✅ Temos ${nome} disponível em estoque!`
}
