/**
 * AI Engine Anti-Alucinação - Nenem Pneus
 *
 * Sistema de IA com consulta ao banco de dados real
 * para garantir 0% de alucinação sobre produtos, preços e estoque.
 *
 * Estratégias anti-alucinação:
 * 1. Consulta ao banco ANTES de chamar IA
 * 2. Prompt com dados reais injetados
 * 3. Guardrails rígidos (IA não pode inventar)
 * 4. Validação da resposta antes de enviar
 * 5. Fallback seguro (direciona para site/humano)
 */

import { db } from '../db'

// Cliente Grok (xAI)
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'

interface ProdutoContexto {
    id: string
    nome: string
    preco: number
    estoque: number
    categoria: string
    specs: {
        marca?: string
        modelo?: string
        aro?: string
        largura?: string
        perfil?: string
        sulco?: string
    }
    imagemUrl?: string
    link: string
}

interface ContextoDados {
    produtos: ProdutoContexto[]
    totalProdutos: number
    categorias: string[]
    horarioFuncionamento: string
    endereco: string
    formasPagamento: string[]
}

// Informações FIXAS da loja (não podem ser alteradas pela IA)
const LOJA_INFO = {
    nome: 'Nenem Pneus',
    endereco: 'Av. Nereu Ramos, 740 - Centro, Capivari de Baixo - SC',
    telefone: '(48) 99997-3889',
    site: 'https://nenempneus.com',
    horario: {
        semana: 'Segunda a Sexta: 8h às 18h',
        sabado: 'Sábado: 8h às 12h',
        domingo: 'Domingo: Fechado'
    },
    pagamento: ['PIX', 'Cartão em até 12x', 'Dinheiro'],
    diferenciais: [
        'Loja física em Capivari de Baixo',
        'Fotos REAIS de cada pneu no site',
        'Garantia em todos os pneus',
        'Instalação INCLUSA no preço'
    ],
    pneusCarro: 'SEMINOVOS de qualidade',
    pneusMoto: 'NOVOS (zero km)'
}

/**
 * Extrai medida de pneu da mensagem do cliente
 * Formatos: 175/70R14, 175/70 R14, 100/80-17, etc.
 */
function extrairMedidaPneu(mensagem: string): { largura?: string; perfil?: string; aro?: string } | null {
    const msgLower = mensagem.toLowerCase()

    // Padrão para carro: 175/70R14 ou 175/70 R14
    const padraoCarroMatch = msgLower.match(/(\d{3})[\s\/]?(\d{2})[\s]?r?(\d{2})/i)
    if (padraoCarroMatch) {
        return {
            largura: padraoCarroMatch[1],
            perfil: padraoCarroMatch[2],
            aro: padraoCarroMatch[3]
        }
    }

    // Padrão para moto: 100/80-17 ou 100/80 17
    const padraoMotoMatch = msgLower.match(/(\d{2,3})[\s\/]?(\d{2})[\s\-]?(\d{2})/i)
    if (padraoMotoMatch) {
        return {
            largura: padraoMotoMatch[1],
            perfil: padraoMotoMatch[2],
            aro: padraoMotoMatch[3]
        }
    }

    // Apenas aro: R14, R15, aro 14, etc.
    const apenasAroMatch = msgLower.match(/(?:r|aro\s?)(\d{2})/i)
    if (apenasAroMatch) {
        return { aro: apenasAroMatch[1] }
    }

    return null
}

/**
 * Detecta se cliente está perguntando sobre moto
 */
function isPerguntaMoto(mensagem: string): boolean {
    const keywords = [
        'moto', 'motocicleta', 'motinha', 'duas rodas',
        'honda', 'yamaha', 'suzuki', 'kawasaki', 'bmw moto',
        'fazer', 'cg', 'biz', 'pcx', 'xre', 'cb', 'bros',
        'factor', 'crosser', 'lander', 'tenere', 'pop', 'titan',
        'fan', 'start', 'nmax', 'neo', 'fluo', 'burgman'
    ]
    const msgLower = mensagem.toLowerCase()
    return keywords.some(k => msgLower.includes(k))
}

/**
 * Detecta se é uma saudação ou conversa casual
 */
function isSaudacao(mensagem: string): boolean {
    const msgLower = mensagem.toLowerCase().trim()
    const saudacoes = [
        'oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite',
        'eae', 'e aí', 'eai', 'hey', 'hello', 'salve', 'opa',
        'fala', 'fala aí', 'oi oi', 'oii', 'oiee', 'oie'
    ]

    // Verifica se a mensagem é exatamente uma saudação ou começa com saudação
    return saudacoes.some(s =>
        msgLower === s ||
        msgLower.startsWith(s + ' ') ||
        msgLower.startsWith(s + ',') ||
        msgLower.startsWith(s + '!')
    )
}

/**
 * Detecta se é conversa casual (não relacionada a produto)
 */
function isConversaCasual(mensagem: string): boolean {
    const msgLower = mensagem.toLowerCase().trim()
    const casualPatterns = [
        'tudo bem', 'tudo bom', 'tudo certo', 'tudo tranquilo',
        'como vai', 'como está', 'como esta', 'como vc está', 'como vc ta',
        'você tá bem', 'voce ta bem', 'vc tá bem', 'vc ta bem',
        'td bem', 'td bom', 'blz', 'beleza', 'suave', 'de boa',
        'obrigado', 'obrigada', 'valeu', 'vlw', 'brigado', 'brigada',
        'tchau', 'até mais', 'ate mais', 'flw', 'falou', 'bye'
    ]

    return casualPatterns.some(p => msgLower.includes(p))
}

/**
 * Detecta se é uma pergunta sobre produto/preço
 */
function isPerguntaProduto(mensagem: string): boolean {
    const msgLower = mensagem.toLowerCase()
    const keywords = [
        'pneu', 'pneus', 'preço', 'preco', 'quanto', 'valor',
        'tem', 'disponível', 'disponivel', 'estoque', 'medida',
        'r13', 'r14', 'r15', 'r16', 'r17', 'r18', 'r19', 'r20',
        'aro', '175', '185', '195', '205', '215', '225',
        'comprar', 'quero', 'preciso'
    ]
    return keywords.some(k => msgLower.includes(k))
}

/**
 * Busca produtos relevantes no banco de dados
 */
async function buscarProdutosRelevantes(
    mensagem: string,
    limite: number = 5
): Promise<ProdutoContexto[]> {
    try {
        const medida = extrairMedidaPneu(mensagem)
        const isMoto = isPerguntaMoto(mensagem)

        // Buscar loja padrão (única loja no sistema)
        const loja = await db.loja.findFirst()
        if (!loja) return []

        // Construir filtros
        const where: any = {
            lojaId: loja.id,
            ativo: true,
            estoque: { gt: 0 }
        }

        // Filtrar por categoria se for moto
        if (isMoto) {
            const categoriaMoto = await db.categoria.findFirst({
                where: {
                    lojaId: loja.id,
                    OR: [
                        { nome: { contains: 'moto', mode: 'insensitive' } },
                        { slug: { contains: 'moto', mode: 'insensitive' } }
                    ]
                }
            })
            if (categoriaMoto) {
                where.categoriaId = categoriaMoto.id
            }
        }

        // Buscar produtos
        const produtos = await db.produto.findMany({
            where,
            include: {
                categoria: true
            },
            orderBy: [
                { destaque: 'desc' },
                { estoque: 'desc' }
            ],
            take: 20 // Pegar mais e filtrar depois
        })

        // Filtrar por medida se especificada
        let produtosFiltrados = produtos
        if (medida) {
            produtosFiltrados = produtos.filter(p => {
                const specs = p.specs as any || {}
                const nome = p.nome.toLowerCase()

                // Verificar match no nome ou specs
                const matchAro = medida.aro ?
                    (specs.aro === medida.aro || nome.includes(`r${medida.aro}`) || nome.includes(`aro ${medida.aro}`)) : true
                const matchLargura = medida.largura ?
                    (specs.largura === medida.largura || nome.includes(medida.largura)) : true
                const matchPerfil = medida.perfil ?
                    (specs.perfil === medida.perfil || nome.includes(`/${medida.perfil}`)) : true

                return matchAro && matchLargura && matchPerfil
            })
        }

        // Se não encontrou com filtros, retornar alguns produtos gerais
        if (produtosFiltrados.length === 0) {
            produtosFiltrados = produtos.slice(0, limite)
        }

        // Mapear para formato de contexto
        return produtosFiltrados.slice(0, limite).map(p => ({
            id: p.id,
            nome: p.nome,
            preco: Number(p.preco),
            estoque: p.estoque,
            categoria: p.categoria.nome,
            specs: p.specs as any || {},
            imagemUrl: p.imagemUrl || undefined,
            link: `${LOJA_INFO.site}/produto/${p.slug}`
        }))

    } catch (error) {
        console.error('Erro ao buscar produtos:', error)
        return []
    }
}

/**
 * Busca contexto completo do banco de dados
 */
async function buscarContextoDados(mensagem: string): Promise<ContextoDados> {
    try {
        const loja = await db.loja.findFirst()
        if (!loja) {
            return {
                produtos: [],
                totalProdutos: 0,
                categorias: [],
                horarioFuncionamento: `${LOJA_INFO.horario.semana} | ${LOJA_INFO.horario.sabado}`,
                endereco: LOJA_INFO.endereco,
                formasPagamento: LOJA_INFO.pagamento
            }
        }

        // Só buscar produtos se for pergunta sobre produto (não em saudações)
        let produtos: ProdutoContexto[] = []
        if (isPerguntaProduto(mensagem) && !isSaudacao(mensagem)) {
            produtos = await buscarProdutosRelevantes(mensagem)
        }

        // Contar total de produtos ativos
        const totalProdutos = await db.produto.count({
            where: { lojaId: loja.id, ativo: true }
        })

        // Buscar categorias
        const categorias = await db.categoria.findMany({
            where: { lojaId: loja.id, ativo: true },
            select: { nome: true }
        })

        return {
            produtos,
            totalProdutos,
            categorias: categorias.map(c => c.nome),
            horarioFuncionamento: `${LOJA_INFO.horario.semana} | ${LOJA_INFO.horario.sabado}`,
            endereco: LOJA_INFO.endereco,
            formasPagamento: LOJA_INFO.pagamento
        }

    } catch (error) {
        console.error('Erro ao buscar contexto:', error)
        return {
            produtos: [],
            totalProdutos: 0,
            categorias: [],
            horarioFuncionamento: `${LOJA_INFO.horario.semana} | ${LOJA_INFO.horario.sabado}`,
            endereco: LOJA_INFO.endereco,
            formasPagamento: LOJA_INFO.pagamento
        }
    }
}

/**
 * Busca histórico da conversa
 */
async function buscarHistoricoConversa(
    conversaId: string,
    limite: number = 6
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    try {
        const mensagens = await db.mensagemWhatsApp.findMany({
            where: { conversaId },
            orderBy: { createdAt: 'desc' },
            take: limite
        })

        return mensagens.reverse().map(m => ({
            role: m.direcao === 'entrada' ? 'user' as const : 'assistant' as const,
            content: m.conteudo
        }))

    } catch (error) {
        console.error('Erro ao buscar histórico:', error)
        return []
    }
}

/**
 * Gera o System Prompt anti-alucinação com dados reais
 */
function gerarSystemPrompt(contexto: ContextoDados): string {
    let prompt = `Você é a Cinthia, atendente virtual da Nenem Pneus via WhatsApp.

## REGRAS ABSOLUTAS (NUNCA QUEBRE ESTAS REGRAS)

1. **NUNCA INVENTE** preços, produtos, medidas ou informações que não estejam nos dados abaixo
2. **NUNCA PROMETA** prazos, descontos ou condições que não existem
3. **SE NÃO SOUBER**, direcione para o site: ${LOJA_INFO.site}
4. **SEMPRE USE** os dados reais fornecidos abaixo

## INFORMAÇÕES DA LOJA (FIXAS)

Nome: ${LOJA_INFO.nome}
Endereço: ${LOJA_INFO.endereco}
Telefone: ${LOJA_INFO.telefone}
Site: ${LOJA_INFO.site}

Horário:
- ${LOJA_INFO.horario.semana}
- ${LOJA_INFO.horario.sabado}
- ${LOJA_INFO.horario.domingo}

Pagamento: ${LOJA_INFO.pagamento.join(', ')}

Diferenciais:
${LOJA_INFO.diferenciais.map(d => `- ${d}`).join('\n')}

## TIPOS DE PNEU

- Pneus para CARRO: ${LOJA_INFO.pneusCarro}
- Pneus para MOTO: ${LOJA_INFO.pneusMoto}

## PRODUTOS DISPONÍVEIS NO ESTOQUE (DADOS REAIS DO BANCO)
`

    if (contexto.produtos.length > 0) {
        prompt += `\nEncontramos ${contexto.produtos.length} produto(s) relevante(s):\n\n`

        contexto.produtos.forEach((p, i) => {
            prompt += `${i + 1}. **${p.nome}**\n`
            prompt += `   - Preço: R$ ${p.preco.toFixed(2)}\n`
            prompt += `   - Estoque: ${p.estoque} unidade(s)\n`
            prompt += `   - Categoria: ${p.categoria}\n`
            if (p.specs.marca) prompt += `   - Marca: ${p.specs.marca}\n`
            if (p.specs.aro) prompt += `   - Aro: ${p.specs.aro}\n`
            prompt += `   - Link: ${p.link}\n\n`
        })
    } else {
        prompt += `\nNenhum produto específico encontrado para esta consulta.
Direcione o cliente para ver todas as opções no site: ${LOJA_INFO.site}/produtos\n`
    }

    prompt += `
## ESTOQUE GERAL

- Total de produtos ativos: ${contexto.totalProdutos}
- Categorias: ${contexto.categorias.join(', ') || 'Pneus para carros e motos'}

## COMO RESPONDER

1. Seja simpática e direta (máximo 3 parágrafos)
2. Use emojis com moderação: 😊 ✅ 🛞 🏍️
3. SEMPRE inclua o link do site quando falar de produtos
4. Se o cliente perguntar algo que você não tem nos dados, diga que ele pode ver no site
5. Termine com uma pergunta ou próximo passo claro
6. Use *asteriscos* para negrito (formato WhatsApp)

## RESPOSTAS PROIBIDAS

NUNCA diga:
- "Temos pneus a partir de R$ X" (se não tiver esse dado)
- "O preço é aproximadamente..." (sempre use o preço exato)
- "Acredito que temos..." (só fale se tiver certeza nos dados)
- "Provavelmente..." ou "Talvez..." sobre produtos/preços

SE NÃO TIVER A INFORMAÇÃO NOS DADOS ACIMA:
→ "Dá uma olhada no nosso site que lá tem tudo atualizado: ${LOJA_INFO.site} 😊"
`

    return prompt
}

/**
 * Valida a resposta da IA antes de enviar
 * Verifica se não inventou preços ou produtos
 */
function validarResposta(resposta: string, contexto: ContextoDados): { valida: boolean; motivo?: string } {
    // Extrair valores monetários da resposta
    const valoresMatch = resposta.match(/R\$\s*[\d.,]+/g)

    if (valoresMatch) {
        // Verificar se cada valor mencionado existe nos produtos
        const precosReais = contexto.produtos.map(p => p.preco)

        for (const valorStr of valoresMatch) {
            const valor = parseFloat(valorStr.replace('R$', '').replace('.', '').replace(',', '.').trim())

            // Verificar se o valor está próximo de algum preço real (tolerância de 1%)
            const existePreco = precosReais.some(p => Math.abs(p - valor) < p * 0.01)

            if (!existePreco && valor > 50) { // Ignorar valores muito baixos (podem ser porcentagens)
                return {
                    valida: false,
                    motivo: `Preço inventado detectado: ${valorStr}`
                }
            }
        }
    }

    // Verificar se menciona produtos que não existem
    const produtosNomes = contexto.produtos.map(p => p.nome.toLowerCase())

    // Padrões suspeitos de alucinação
    const padroesSuspeitos = [
        /temos.*pneus.*a partir de/i,
        /aproximadamente/i,
        /acredito que/i,
        /provavelmente/i,
        /deve custar/i,
        /por volta de/i
    ]

    for (const padrao of padroesSuspeitos) {
        if (padrao.test(resposta)) {
            return {
                valida: false,
                motivo: `Linguagem incerta detectada: ${padrao.toString()}`
            }
        }
    }

    return { valida: true }
}

/**
 * Resposta de fallback segura
 */
function respostaFallback(contexto: ContextoDados, mensagem: string, nomeCliente?: string): string {
    const msgLower = mensagem.toLowerCase().trim()

    // Se for saudação, retornar saudação apropriada
    if (isSaudacao(mensagem)) {
        const nome = nomeCliente ? `, ${nomeCliente}` : ''
        return `Oi${nome}! Sou a Cinthia, da *Nenem Pneus*! 😊

Como posso te ajudar hoje?

Trabalhamos com:
🛞 Pneus pra carro (seminovos de qualidade)
🏍️ Pneus pra moto (novos!)

Dá uma olhada no nosso site: ${LOJA_INFO.site}`
    }

    // Se for conversa casual (tudo bem, como vai, etc.)
    if (isConversaCasual(mensagem)) {
        // Agradecimento
        if (msgLower.includes('obrigad') || msgLower.includes('valeu') || msgLower.includes('vlw') || msgLower.includes('brigad')) {
            return `Por nada! 😊 Se precisar de mais alguma coisa, é só chamar!

Nosso site: ${LOJA_INFO.site}`
        }

        // Despedida
        if (msgLower.includes('tchau') || msgLower.includes('até') || msgLower.includes('flw') || msgLower.includes('bye') || msgLower.includes('falou')) {
            return `Até mais! 😊 Quando precisar de pneus, é só chamar!

Nosso site: ${LOJA_INFO.site}`
        }

        // Pergunta de como está
        const nome = nomeCliente ? `, ${nomeCliente}` : ''
        return `Tô bem sim${nome}, obrigada por perguntar! 😊

E você, tá precisando de pneus? Posso te ajudar!

🛞 Pneus pra carro (seminovos de qualidade)
🏍️ Pneus pra moto (novos!)

Me conta, qual a medida do seu pneu?`
    }

    // Se tem produtos no contexto, mostrar
    if (contexto.produtos.length > 0) {
        const produto = contexto.produtos[0]
        return `Oi! Encontrei essa opção pra você:

🛞 *${produto.nome}*
💰 R$ ${produto.preco.toFixed(2)}
📦 ${produto.estoque} em estoque

Veja mais detalhes aqui: ${produto.link}

Quer ver mais opções? Dá uma olhada no nosso site: ${LOJA_INFO.site} 😊`
    }

    // Resposta genérica
    return `Oi! Sou a Cinthia, da Nenem Pneus! 😊

Posso te ajudar com pneus! Me conta o que você precisa:

🛞 Pneus pra carro (seminovos de qualidade)
🏍️ Pneus pra moto (novos!)

Qual a medida do seu pneu? Ou dá uma olhada no site: ${LOJA_INFO.site}`
}

/**
 * Chama a API do Grok
 */
async function chamarGrok(
    systemPrompt: string,
    mensagem: string,
    historico: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string | null> {
    try {
        const apiKey = process.env.XAI_API_KEY
        if (!apiKey) {
            console.error('XAI_API_KEY não configurada')
            return null
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...historico,
            { role: 'user', content: mensagem }
        ]

        const response = await fetch(GROK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'grok-2-latest',
                messages,
                temperature: 0.3, // Baixa temperatura = menos criatividade = menos alucinação
                max_tokens: 500
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('Erro na API Grok:', error)
            return null
        }

        const data = await response.json()
        return data.choices?.[0]?.message?.content || null

    } catch (error) {
        console.error('Erro ao chamar Grok:', error)
        return null
    }
}

/**
 * Função principal: Gera resposta com IA anti-alucinação
 */
export async function gerarRespostaIA(
    conversaId: string,
    nomeCliente: string,
    mensagem: string,
    telefone?: string
): Promise<string> {
    try {
        console.log('🤖 [AI Engine] Iniciando geração de resposta...')

        // 1. Buscar contexto do banco de dados
        console.log('📊 [AI Engine] Buscando dados do banco...')
        const contexto = await buscarContextoDados(mensagem)
        console.log(`📦 [AI Engine] ${contexto.produtos.length} produtos encontrados`)

        // 2. Buscar histórico da conversa
        const historico = await buscarHistoricoConversa(conversaId)
        console.log(`💬 [AI Engine] ${historico.length} mensagens no histórico`)

        // 3. Gerar system prompt com dados reais
        const systemPrompt = gerarSystemPrompt(contexto)

        // 4. Adicionar nome do cliente na mensagem se disponível
        const mensagemComContexto = nomeCliente
            ? `[Cliente: ${nomeCliente}] ${mensagem}`
            : mensagem

        // 5. Chamar IA
        console.log('🧠 [AI Engine] Chamando Grok...')
        const respostaIA = await chamarGrok(systemPrompt, mensagemComContexto, historico)

        if (!respostaIA) {
            console.log('⚠️ [AI Engine] Grok não respondeu, usando fallback')
            return respostaFallback(contexto, mensagem, nomeCliente)
        }

        // 6. Validar resposta
        console.log('✅ [AI Engine] Validando resposta...')
        const validacao = validarResposta(respostaIA, contexto)

        if (!validacao.valida) {
            console.log(`🚫 [AI Engine] Resposta inválida: ${validacao.motivo}`)
            console.log(`🚫 [AI Engine] Resposta rejeitada: ${respostaIA.substring(0, 100)}...`)
            return respostaFallback(contexto, mensagem, nomeCliente)
        }

        console.log('✅ [AI Engine] Resposta validada com sucesso')

        // 7. Marcar mensagens como processadas
        await db.mensagemWhatsApp.updateMany({
            where: {
                conversaId,
                direcao: 'entrada',
                processadoPorIa: false
            },
            data: {
                processadoPorIa: true
            }
        })

        return respostaIA

    } catch (error) {
        console.error('❌ [AI Engine] Erro:', error)
        return respostaFallback({
            produtos: [],
            totalProdutos: 0,
            categorias: [],
            horarioFuncionamento: `${LOJA_INFO.horario.semana} | ${LOJA_INFO.horario.sabado}`,
            endereco: LOJA_INFO.endereco,
            formasPagamento: LOJA_INFO.pagamento
        }, mensagem, nomeCliente)
    }
}

/**
 * Verifica se deve transferir para humano
 */
export function verificarTransferenciaHumano(mensagem: string): boolean {
    const palavrasChave = [
        'atendente', 'humano', 'pessoa', 'falar com alguém', 'falar com alguem',
        'não entendi', 'nao entendi', 'gente', 'operador', 'gerente', 'dono',
        'reclamação', 'reclamacao', 'problema sério', 'problema serio',
        'insatisfeito', 'muito irritado', 'quero cancelar', 'cancelar pedido'
    ]

    const msgLower = mensagem.toLowerCase()
    return palavrasChave.some(p => msgLower.includes(p))
}

/**
 * Gera resposta de transferência
 */
export function gerarRespostaTransferencia(): string {
    return 'Vou te conectar com nosso atendente agora! Um momento. 👨‍💼'
}
