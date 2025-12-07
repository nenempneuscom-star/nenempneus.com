import { db } from '../../db'

export type TipoFeedback = 'positivo' | 'negativo' | 'correcao'

export interface Feedback {
    id: string
    conversaId: string
    mensagemId: string
    tipo: TipoFeedback
    feedback?: string
    correcao?: string
    usuarioId?: string
    createdAt: Date
}

// Registra feedback sobre uma resposta da IA
export async function registrarFeedback(
    conversaId: string,
    mensagemId: string,
    tipo: TipoFeedback,
    opcoes?: {
        feedback?: string
        correcao?: string
        usuarioId?: string
    }
): Promise<Feedback | null> {
    try {
        const feedbackCriado = await db.feedbackIA.create({
            data: {
                conversaId,
                mensagemId,
                tipo,
                feedback: opcoes?.feedback,
                correcao: opcoes?.correcao,
                usuarioId: opcoes?.usuarioId,
            },
        })

        return feedbackCriado as Feedback
    } catch (error) {
        console.error('Erro ao registrar feedback:', error)
        return null
    }
}

// Busca feedbacks por conversa
export async function buscarFeedbacksConversa(conversaId: string): Promise<Feedback[]> {
    try {
        const feedbacks = await db.feedbackIA.findMany({
            where: { conversaId },
            orderBy: { createdAt: 'desc' },
        })

        return feedbacks as Feedback[]
    } catch (error) {
        console.error('Erro ao buscar feedbacks:', error)
        return []
    }
}

// Busca feedbacks negativos recentes (para análise)
export async function buscarFeedbacksNegativos(limite: number = 50): Promise<Array<{
    feedback: Feedback
    mensagem: { conteudo: string; direcao: string } | null
    conversa: { telefone: string; nomeContato: string | null } | null
}>> {
    try {
        const feedbacks = await db.feedbackIA.findMany({
            where: {
                tipo: { in: ['negativo', 'correcao'] },
            },
            orderBy: { createdAt: 'desc' },
            take: limite,
        })

        // Buscar dados relacionados
        const resultado = []
        for (const fb of feedbacks) {
            const mensagem = await db.mensagemWhatsApp.findUnique({
                where: { id: fb.mensagemId },
                select: { conteudo: true, direcao: true },
            })

            const conversa = await db.conversaWhatsApp.findUnique({
                where: { id: fb.conversaId },
                select: { telefone: true, nomeContato: true },
            })

            resultado.push({
                feedback: fb as Feedback,
                mensagem,
                conversa,
            })
        }

        return resultado
    } catch (error) {
        console.error('Erro ao buscar feedbacks negativos:', error)
        return []
    }
}

// Estatísticas de feedback
export async function getEstatisticasFeedback(): Promise<{
    total: number
    positivos: number
    negativos: number
    correcoes: number
    taxaPositiva: number
}> {
    try {
        const [total, positivos, negativos, correcoes] = await Promise.all([
            db.feedbackIA.count(),
            db.feedbackIA.count({ where: { tipo: 'positivo' } }),
            db.feedbackIA.count({ where: { tipo: 'negativo' } }),
            db.feedbackIA.count({ where: { tipo: 'correcao' } }),
        ])

        const taxaPositiva = total > 0 ? (positivos / total) * 100 : 0

        return {
            total,
            positivos,
            negativos,
            correcoes,
            taxaPositiva: Math.round(taxaPositiva * 10) / 10,
        }
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error)
        return { total: 0, positivos: 0, negativos: 0, correcoes: 0, taxaPositiva: 0 }
    }
}

// Busca padrões de correções para melhorar o prompt
export async function analisarCorrecoes(): Promise<Array<{
    padrao: string
    ocorrencias: number
    exemplos: Array<{ original: string; correcao: string }>
}>> {
    try {
        const correcoes = await db.feedbackIA.findMany({
            where: {
                tipo: 'correcao',
                correcao: { not: null },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        })

        // Agrupa por padrões simples (isso pode ser melhorado com NLP)
        const padroes = new Map<string, Array<{ original: string; correcao: string }>>()

        for (const c of correcoes) {
            if (!c.correcao) continue

            // Busca mensagem original
            const mensagem = await db.mensagemWhatsApp.findUnique({
                where: { id: c.mensagemId },
            })

            if (!mensagem) continue

            // Categoriza por palavras-chave (simplificado)
            let categoria = 'outros'

            if (c.correcao.toLowerCase().includes('preço') || c.correcao.toLowerCase().includes('valor')) {
                categoria = 'precos'
            } else if (c.correcao.toLowerCase().includes('medida') || c.correcao.toLowerCase().includes('tamanho')) {
                categoria = 'medidas'
            } else if (c.correcao.toLowerCase().includes('estoque') || c.correcao.toLowerCase().includes('disponível')) {
                categoria = 'estoque'
            } else if (c.correcao.toLowerCase().includes('horário') || c.correcao.toLowerCase().includes('agendamento')) {
                categoria = 'agendamento'
            }

            if (!padroes.has(categoria)) {
                padroes.set(categoria, [])
            }

            padroes.get(categoria)!.push({
                original: mensagem.conteudo,
                correcao: c.correcao,
            })
        }

        return Array.from(padroes.entries()).map(([padrao, exemplos]) => ({
            padrao,
            ocorrencias: exemplos.length,
            exemplos: exemplos.slice(0, 3), // Máximo 3 exemplos por padrão
        }))
    } catch (error) {
        console.error('Erro ao analisar correções:', error)
        return []
    }
}

// Gera sugestões de melhoria baseado nos feedbacks
export async function gerarSugestoesMelhoria(): Promise<string[]> {
    const sugestoes: string[] = []

    try {
        const stats = await getEstatisticasFeedback()
        const padroes = await analisarCorrecoes()

        // Sugestão baseada na taxa positiva
        if (stats.taxaPositiva < 70) {
            sugestoes.push(`Taxa de satisfação está em ${stats.taxaPositiva}%. Revisar respostas frequentes.`)
        }

        // Sugestões baseadas nos padrões de correção
        for (const padrao of padroes) {
            if (padrao.ocorrencias >= 3) {
                sugestoes.push(`Padrão "${padrao.padrao}" identificado em ${padrao.ocorrencias} correções. Considere ajustar as respostas sobre este tema.`)
            }
        }

        // Se não houver sugestões, é um bom sinal
        if (sugestoes.length === 0) {
            sugestoes.push('✅ Performance da IA está dentro do esperado!')
        }

        return sugestoes
    } catch (error) {
        console.error('Erro ao gerar sugestões:', error)
        return ['Erro ao analisar feedbacks']
    }
}
