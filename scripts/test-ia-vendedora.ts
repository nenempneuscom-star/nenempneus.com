/**
 * Script de teste da IA Vendedora (Cinthia)
 *
 * Simula cenários reais de conversa sem precisar de WhatsApp.
 * Chama gerarRespostaIA() diretamente com históricos simulados.
 *
 * Uso: npx tsx scripts/test-ia-vendedora.ts
 */

import { gerarRespostaIA, isEncerramento, isNegociacao } from '../lib/whatsapp/ai-engine'

// ID de conversa fictício para teste
const CONVERSA_ID_TESTE = 'test-conversa-000'

interface Cenario {
    nome: string
    mensagens: Array<{ de: 'cliente' | 'bot'; texto: string }>
    validacoes: Array<(resposta: string) => { ok: boolean; motivo: string }>
}

const cenarios: Cenario[] = [
    {
        nome: '1. Cliente pede medida específica (235/45 R19)',
        mensagens: [
            { de: 'cliente', texto: 'oi, tem pneu 235/45 r19?' },
        ],
        validacoes: [
            (r) => ({
                ok: !r.toLowerCase().includes('ibuprofeno') && !r.toLowerCase().includes('pizza'),
                motivo: 'Resposta não deve conter itens fora de contexto'
            }),
            (r) => ({
                ok: r.includes('R$') || r.toLowerCase().includes('site') || r.toLowerCase().includes('nenempneus'),
                motivo: 'Deve conter preço do produto ou direcionar para o site'
            }),
        ],
    },
    {
        nome: '2. Cliente pede desconto (negociação)',
        mensagens: [
            { de: 'cliente', texto: 'tem pneu 205/55 r16?' },
            { de: 'bot', texto: 'Temos sim! 🛞 *Pneu 205/55 R16 Goodyear* por R$ 289,00. Instalação inclusa e garantia! Quer garantir o seu?' },
            { de: 'cliente', texto: 'faz por 250?' },
        ],
        validacoes: [
            (r) => ({
                ok: isNegociacao('faz por 250?'),
                motivo: 'isNegociacao deve detectar pedido de desconto'
            }),
            (r) => ({
                ok: !r.toLowerCase().includes('handerson') && !r.includes('99997-3889'),
                motivo: 'Na primeira negociação, NÃO deve passar contato do dono'
            }),
            (r) => ({
                ok: r.toLowerCase().includes('instalação') || r.toLowerCase().includes('instalacao') || r.toLowerCase().includes('inclus'),
                motivo: 'Deve argumentar valor (instalação inclusa)'
            }),
        ],
    },
    {
        nome: '3. Cliente insiste no desconto → passa contato do Handerson',
        mensagens: [
            { de: 'cliente', texto: 'tem pneu 205/55 r16?' },
            { de: 'bot', texto: 'Temos sim! Pneu 205/55 R16 Goodyear por R$ 289,00.' },
            { de: 'cliente', texto: 'faz por 250?' },
            { de: 'bot', texto: 'Entendo! Mas olha: nosso preço já inclui instalação e garantia. Quer garantir o seu?' },
            { de: 'cliente', texto: 'mas não tem como fazer por menos?' },
        ],
        validacoes: [
            (r) => ({
                ok: r.toLowerCase().includes('handerson') || r.includes('99997-3889'),
                motivo: 'Na segunda insistência, DEVE passar contato do Handerson'
            }),
        ],
    },
    {
        nome: '4. Cliente diz "já resolvi" → aceita sem insistir',
        mensagens: [
            { de: 'cliente', texto: 'já consegui resolver, obrigado' },
        ],
        validacoes: [
            (r) => ({
                ok: isEncerramento('já consegui resolver, obrigado'),
                motivo: 'isEncerramento deve detectar encerramento'
            }),
            (r) => ({
                ok: r.length < 200,
                motivo: 'Resposta de encerramento deve ser curta (< 200 chars)'
            }),
            (r) => ({
                ok: !r.toLowerCase().includes('passar na loja') && !r.toLowerCase().includes('garantir'),
                motivo: 'NÃO deve insistir após encerramento'
            }),
        ],
    },
    {
        nome: '5. Cliente manda "oi" no meio da conversa → não reseta saudação',
        mensagens: [
            { de: 'cliente', texto: 'oi' },
            { de: 'bot', texto: 'Oi! Sou a Cinthia, da Nenem Pneus! Como posso te ajudar?' },
            { de: 'cliente', texto: 'tem pneu r14?' },
            { de: 'bot', texto: 'Temos sim! Pneu 175/70 R14 por R$ 179,00.' },
            { de: 'cliente', texto: 'oi' },
        ],
        validacoes: [
            (r) => ({
                ok: !r.toLowerCase().includes('sou a cinthia'),
                motivo: 'NÃO deve se apresentar de novo no meio da conversa'
            }),
        ],
    },
    {
        nome: '6. Cliente em emergência (pneu rasgou)',
        mensagens: [
            { de: 'cliente', texto: 'meu pneu rasgou na viagem, preciso urgente de um 195/65 r15' },
        ],
        validacoes: [
            (r) => ({
                ok: r.includes('R$') || r.toLowerCase().includes('site') || r.toLowerCase().includes('nenempneus') || r.toLowerCase().includes('estoque') || r.toLowerCase().includes('195/65'),
                motivo: 'Deve apresentar produto, mencionar estoque ou direcionar para o site'
            }),
        ],
    },
]

async function rodarTestes() {
    console.log('🧪 Iniciando testes da IA Vendedora (Cinthia)\n')
    console.log('='.repeat(60))

    let totalTestes = 0
    let totalPassaram = 0
    let totalFalharam = 0

    for (const cenario of cenarios) {
        console.log(`\n📋 ${cenario.nome}`)
        console.log('-'.repeat(50))

        // Última mensagem do cliente
        const ultimaMensagem = cenario.mensagens[cenario.mensagens.length - 1]
        console.log(`💬 Cliente: "${ultimaMensagem.texto}"`)

        try {
            const resultado = await gerarRespostaIA(
                CONVERSA_ID_TESTE,
                'João',
                ultimaMensagem.texto,
                '5548999990000'
            )

            console.log(`🤖 Cinthia: "${resultado.texto.substring(0, 150)}${resultado.texto.length > 150 ? '...' : ''}"`)

            if (resultado.produtosComImagem.length > 0) {
                console.log(`📸 Produtos com imagem: ${resultado.produtosComImagem.map(p => p.nome).join(', ')}`)
            }

            // Rodar validações
            for (const validacao of cenario.validacoes) {
                totalTestes++
                const { ok, motivo } = validacao(resultado.texto)
                if (ok) {
                    totalPassaram++
                    console.log(`  ✅ ${motivo}`)
                } else {
                    totalFalharam++
                    console.log(`  ❌ FALHOU: ${motivo}`)
                }
            }
        } catch (error: any) {
            console.log(`  ❌ ERRO: ${error.message}`)
            totalFalharam += cenario.validacoes.length
            totalTestes += cenario.validacoes.length
        }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`\n📊 Resultado: ${totalPassaram}/${totalTestes} passaram, ${totalFalharam} falharam`)

    if (totalFalharam > 0) {
        console.log('\n⚠️ Alguns testes falharam. Revise as respostas acima.')
        process.exit(1)
    } else {
        console.log('\n🎉 Todos os testes passaram!')
        process.exit(0)
    }
}

rodarTestes().catch(err => {
    console.error('Erro fatal:', err)
    process.exit(1)
})
