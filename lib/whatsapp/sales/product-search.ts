import { db } from '../../db'
import { LOJA_SLUG } from '../../constants'
import { ProdutoRecomendado } from '../types'

// Base de medidas por veículo (expandir conforme necessário)
const MEDIDAS_VEICULOS: Record<string, string[]> = {
    // VW
    'gol': ['175/70 R14', '185/60 R15'],
    'golf': ['195/65 R15', '205/55 R16', '225/45 R17'],
    'polo': ['185/65 R15', '195/55 R16'],
    'voyage': ['175/70 R14', '185/60 R15'],
    'fox': ['185/60 R15', '195/55 R16'],
    'up': ['175/65 R14', '185/55 R15'],
    'virtus': ['185/60 R15', '195/55 R16'],
    'nivus': ['195/55 R16', '205/50 R17'],
    't-cross': ['205/60 R16', '205/55 R17'],
    'tiguan': ['215/65 R17', '235/55 R18'],
    'jetta': ['205/55 R16', '225/45 R17'],
    'passat': ['215/55 R16', '235/45 R17'],
    'amarok': ['245/70 R16', '255/60 R18'],
    'saveiro': ['175/70 R14', '205/60 R15'],

    // Fiat
    'uno': ['165/70 R13', '175/65 R14'],
    'palio': ['175/65 R14', '185/60 R15'],
    'siena': ['175/65 R14', '185/60 R15'],
    'punto': ['185/65 R15', '195/55 R16'],
    'bravo': ['195/55 R16', '205/50 R17'],
    'linea': ['195/60 R15', '205/55 R16'],
    'idea': ['185/65 R15', '195/60 R15'],
    'mobi': ['165/70 R14', '175/65 R14'],
    'argo': ['175/65 R14', '185/60 R15', '195/55 R16'],
    'cronos': ['185/60 R15', '195/55 R16'],
    'toro': ['215/60 R17', '225/55 R18'],
    'strada': ['175/70 R14', '185/65 R15', '205/60 R16'],
    'fiorino': ['175/65 R14', '185/65 R15'],
    'ducato': ['215/70 R15', '225/70 R15'],
    'pulse': ['195/55 R16', '205/50 R17'],
    'fastback': ['205/50 R17', '215/45 R18'],

    // Chevrolet
    'onix': ['185/70 R14', '195/55 R16'],
    'prisma': ['185/70 R14', '195/55 R16'],
    'cruze': ['205/55 R16', '225/45 R17'],
    'cobalt': ['185/70 R14', '195/65 R15'],
    'spin': ['195/65 R15', '205/55 R16'],
    'tracker': ['205/65 R16', '215/55 R17'],
    'equinox': ['225/65 R17', '235/55 R18'],
    's10': ['205/70 R15', '245/70 R16', '255/65 R17'],
    'montana': ['195/60 R16', '205/55 R17'],
    'celta': ['165/70 R13', '175/65 R14'],
    'classic': ['175/70 R13', '175/65 R14'],
    'agile': ['185/65 R15', '195/55 R16'],
    'sonic': ['195/55 R16', '205/50 R17'],

    // Ford
    'ka': ['175/65 R14', '185/55 R15', '195/50 R16'],
    'fiesta': ['175/65 R14', '185/55 R15'],
    'focus': ['195/60 R15', '205/55 R16', '215/50 R17'],
    'ecosport': ['195/65 R15', '205/60 R16', '215/55 R17'],
    'ranger': ['245/70 R16', '255/70 R16', '265/65 R17'],
    'territory': ['225/65 R17', '235/55 R18'],
    'maverick': ['225/65 R17', '255/70 R17'],
    'bronco': ['255/70 R16', '265/70 R17'],

    // Hyundai
    'hb20': ['175/70 R14', '185/60 R15', '195/50 R16'],
    'hb20s': ['175/70 R14', '185/60 R15'],
    'creta': ['205/60 R16', '215/55 R17'],
    'tucson': ['215/65 R16', '225/55 R18'],
    'santa fe': ['235/60 R18', '235/55 R19'],
    'i30': ['205/55 R16', '225/45 R17'],
    'elantra': ['195/65 R15', '205/55 R16'],
    'veloster': ['215/40 R18', '225/40 R18'],
    'azera': ['215/55 R17', '235/50 R18'],

    // Honda
    'civic': ['195/65 R15', '205/55 R16', '215/50 R17'],
    'fit': ['175/65 R15', '185/55 R16'],
    'city': ['175/65 R15', '185/55 R16'],
    'hr-v': ['205/60 R16', '215/55 R17'],
    'cr-v': ['225/65 R17', '235/60 R18'],
    'wr-v': ['195/60 R16', '205/60 R16'],
    'accord': ['215/55 R17', '235/45 R18'],

    // Toyota
    'corolla': ['195/65 R15', '205/55 R16', '215/50 R17'],
    'etios': ['175/70 R14', '185/60 R15'],
    'yaris': ['175/65 R15', '185/60 R15'],
    'hilux': ['225/70 R17', '265/65 R17', '265/60 R18'],
    'sw4': ['225/70 R17', '265/65 R17'],
    'rav4': ['225/65 R17', '235/55 R18'],
    'corolla cross': ['215/60 R17', '225/55 R18'],
    'camry': ['205/65 R16', '215/55 R17'],

    // Renault
    'sandero': ['185/65 R15', '195/55 R16'],
    'logan': ['185/65 R15', '195/55 R16'],
    'duster': ['215/60 R17', '215/55 R18'],
    'kwid': ['155/80 R13', '165/70 R14'],
    'captur': ['205/60 R17', '215/55 R17'],
    'stepway': ['195/55 R16', '205/50 R17'],
    'oroch': ['215/60 R17', '215/55 R18'],
    'fluence': ['205/55 R16', '205/50 R17'],
    'megane': ['195/65 R15', '205/55 R16'],
    'clio': ['175/65 R14', '185/60 R15'],

    // Nissan
    'kicks': ['205/60 R16', '205/55 R17'],
    'march': ['165/70 R14', '175/60 R15'],
    'versa': ['175/70 R14', '185/60 R15'],
    'sentra': ['195/60 R16', '205/55 R17'],
    'frontier': ['245/70 R16', '255/70 R16'],
    'livina': ['185/65 R15', '195/55 R16'],

    // Jeep
    'renegade': ['215/60 R17', '215/55 R18'],
    'compass': ['215/60 R17', '225/55 R18'],
    'commander': ['235/55 R19', '235/50 R20'],
    'wrangler': ['255/70 R18', '285/70 R17'],

    // Mitsubishi
    'outlander': ['215/70 R16', '225/55 R18'],
    'asx': ['215/60 R17', '215/55 R18'],
    'pajero': ['265/70 R16', '265/65 R17'],
    'l200': ['245/70 R16', '265/60 R18'],
    'eclipse cross': ['215/70 R16', '225/55 R18'],

    // Peugeot
    '208': ['185/65 R15', '195/55 R16', '205/50 R17'],
    '2008': ['205/60 R16', '215/55 R17'],
    '308': ['195/65 R15', '205/55 R16', '225/45 R17'],
    '3008': ['215/55 R18', '225/55 R18'],
    '408': ['205/55 R16', '215/50 R17'],
    'partner': ['195/65 R15', '205/65 R15'],

    // Citroen
    'c3': ['185/65 R15', '195/55 R16'],
    'c4 cactus': ['205/55 R17', '215/55 R17'],
    'c4 lounge': ['205/55 R16', '215/50 R17'],
    'aircross': ['205/60 R16', '215/55 R17'],

    // Kia
    'sportage': ['215/70 R16', '225/55 R18', '235/55 R19'],
    'sorento': ['235/60 R18', '235/55 R19'],
    'cerato': ['195/65 R15', '205/55 R16', '215/45 R17'],
    'soul': ['195/65 R15', '205/60 R16'],
    'picanto': ['165/60 R14', '175/50 R15'],
    'stonic': ['205/55 R17', '215/50 R17'],
    'seltos': ['215/60 R17', '215/55 R18'],
    'carnival': ['235/60 R18', '235/55 R19'],

    // Suzuki
    'vitara': ['215/55 R17', '215/55 R18'],
    'jimny': ['195/80 R15', '215/75 R15'],
    's-cross': ['205/55 R17', '215/50 R17'],
    'swift': ['175/65 R15', '185/55 R16'],

    // Subaru
    'forester': ['225/60 R17', '225/55 R18'],
    'impreza': ['195/65 R15', '205/55 R16'],
    'xv': ['225/55 R18', '225/60 R17'],
    'outback': ['225/60 R18', '225/65 R17'],
    'wrx': ['235/45 R17', '245/40 R18'],

    // Mercedes-Benz
    'classe a': ['205/55 R16', '225/45 R17'],
    'classe c': ['205/55 R16', '225/45 R17', '225/40 R18'],
    'gla': ['215/60 R17', '235/50 R18'],
    'glb': ['215/65 R17', '235/55 R18'],
    'glc': ['235/60 R18', '255/45 R20'],

    // BMW
    'serie 1': ['205/55 R16', '225/45 R17'],
    'serie 3': ['205/55 R16', '225/45 R17', '225/40 R18'],
    'x1': ['215/65 R17', '225/55 R18'],
    'x3': ['225/60 R18', '245/50 R19'],
    'x5': ['265/50 R19', '275/45 R20'],

    // Audi
    'a3': ['205/55 R16', '225/45 R17'],
    'a4': ['225/50 R17', '245/40 R18'],
    'q3': ['215/60 R17', '235/50 R18'],
    'q5': ['235/60 R18', '255/45 R20'],
}

// Normaliza nome do veículo para busca
function normalizarVeiculo(modelo: string): string {
    return modelo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
}

// Extrai informações do veículo da mensagem
export function extrairInfoVeiculo(mensagem: string): {
    marca?: string
    modelo?: string
    ano?: number
    medida?: string
} {
    const msg = mensagem.toLowerCase()
    const resultado: { marca?: string; modelo?: string; ano?: number; medida?: string } = {}

    // Detectar medida diretamente (ex: "175/70 R14")
    const medidaRegex = /(\d{3})[\/\\](\d{2})\s*r?\s*(\d{2})/i
    const matchMedida = msg.match(medidaRegex)
    if (matchMedida) {
        resultado.medida = `${matchMedida[1]}/${matchMedida[2]} R${matchMedida[3]}`
    }

    // Detectar ano (4 dígitos entre 1990 e 2030)
    const anoRegex = /(19[9]\d|20[0-3]\d)/
    const matchAno = msg.match(anoRegex)
    if (matchAno) {
        resultado.ano = parseInt(matchAno[1])
    }

    // Detectar marca
    const marcas = {
        'volkswagen': 'Volkswagen', 'vw': 'Volkswagen',
        'fiat': 'Fiat',
        'chevrolet': 'Chevrolet', 'gm': 'Chevrolet',
        'ford': 'Ford',
        'hyundai': 'Hyundai',
        'honda': 'Honda',
        'toyota': 'Toyota',
        'renault': 'Renault',
        'nissan': 'Nissan',
        'jeep': 'Jeep',
        'mitsubishi': 'Mitsubishi',
        'peugeot': 'Peugeot',
        'citroen': 'Citroen', 'citroën': 'Citroen',
        'kia': 'Kia',
        'suzuki': 'Suzuki',
        'subaru': 'Subaru',
        'mercedes': 'Mercedes-Benz', 'mercedes-benz': 'Mercedes-Benz',
        'bmw': 'BMW',
        'audi': 'Audi',
    }

    for (const [key, value] of Object.entries(marcas)) {
        if (msg.includes(key)) {
            resultado.marca = value
            break
        }
    }

    // Detectar modelo
    for (const modelo of Object.keys(MEDIDAS_VEICULOS)) {
        if (msg.includes(modelo)) {
            resultado.modelo = modelo
            break
        }
    }

    return resultado
}

// Busca medidas compatíveis com o veículo
export function buscarMedidasPorVeiculo(modelo: string): string[] {
    const modeloNorm = normalizarVeiculo(modelo)

    // Busca exata
    if (MEDIDAS_VEICULOS[modeloNorm]) {
        return MEDIDAS_VEICULOS[modeloNorm]
    }

    // Busca parcial
    for (const [key, medidas] of Object.entries(MEDIDAS_VEICULOS)) {
        if (key.includes(modeloNorm) || modeloNorm.includes(key)) {
            return medidas
        }
    }

    return []
}

// Busca produtos no banco de dados
export async function buscarProdutos(filtros: {
    medida?: string
    marca?: string
    precoMax?: number
    apenasEmEstoque?: boolean
    limite?: number
}): Promise<ProdutoRecomendado[]> {
    try {
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) {
            console.error('Loja não encontrada')
            return []
        }

        const where: any = {
            lojaId: loja.id,
            ativo: true,
        }

        // Filtro por estoque
        if (filtros.apenasEmEstoque !== false) {
            where.estoque = { gt: 0 }
        }

        // Filtro por preço máximo
        if (filtros.precoMax) {
            where.preco = { lte: filtros.precoMax }
        }

        // Filtro por medida ou marca (busca no nome e specs)
        if (filtros.medida || filtros.marca) {
            where.OR = []

            if (filtros.medida) {
                // Normalizar medida para busca flexível
                // Ex: "215/55 R18" -> buscar por "215/55" E "18" para encontrar "215/55r18" ou "215/55 R18"
                const medidaLimpa = filtros.medida.replace(/\s+/g, '').toLowerCase() // "215/55r18"
                const partes = filtros.medida.match(/(\d{3}\/\d{2})\s*r?\s*(\d{2})/i)

                if (partes) {
                    // Busca por "215/55" que é mais flexível
                    const larguraPerfil = partes[1] // "215/55"
                    const aro = partes[2] // "18"

                    where.OR.push(
                        // Busca exata sem espaço (215/55r18)
                        { nome: { contains: medidaLimpa, mode: 'insensitive' } },
                        // Busca com espaço (215/55 R18)
                        { nome: { contains: filtros.medida, mode: 'insensitive' } },
                        // Busca só pela largura/perfil + aro separados
                        {
                            AND: [
                                { nome: { contains: larguraPerfil, mode: 'insensitive' } },
                                { nome: { contains: aro, mode: 'insensitive' } }
                            ]
                        },
                        { descricao: { contains: filtros.medida, mode: 'insensitive' } }
                    )
                } else {
                    // Fallback para busca simples
                    where.OR.push(
                        { nome: { contains: filtros.medida, mode: 'insensitive' } },
                        { descricao: { contains: filtros.medida, mode: 'insensitive' } }
                    )
                }
            }

            if (filtros.marca) {
                where.OR.push(
                    { nome: { contains: filtros.marca, mode: 'insensitive' } },
                    { descricao: { contains: filtros.marca, mode: 'insensitive' } }
                )
            }
        }

        const produtos = await db.produto.findMany({
            where,
            orderBy: [
                { destaque: 'desc' },
                { estoque: 'desc' },
                { preco: 'asc' },
            ],
            take: filtros.limite || 5,
        })

        return produtos.map((p) => ({
            id: p.id,
            nome: p.nome,
            preco: Number(p.preco),
            estoque: p.estoque,
            marca: extrairMarcaProduto(p.nome),
            medida: extrairMedidaProduto(p.nome),
            imagemUrl: p.imagemUrl || undefined,
            imagens: (p.imagens as string[]) || [],
            destaque: p.destaque,
        }))
    } catch (error) {
        console.error('Erro ao buscar produtos:', error)
        return []
    }
}

// Busca produtos recomendados para um veículo
export async function buscarProdutosParaVeiculo(
    modelo: string,
    opcoes?: {
        marca?: string
        precoMax?: number
        limite?: number
    }
): Promise<ProdutoRecomendado[]> {
    const medidas = buscarMedidasPorVeiculo(modelo)

    if (medidas.length === 0) {
        // Se não encontrou medidas, busca todos os produtos
        return buscarProdutos({
            marca: opcoes?.marca,
            precoMax: opcoes?.precoMax,
            limite: opcoes?.limite || 5,
        })
    }

    // Busca produtos para cada medida e consolida
    const todosResultados: ProdutoRecomendado[] = []

    for (const medida of medidas) {
        const produtos = await buscarProdutos({
            medida,
            marca: opcoes?.marca,
            precoMax: opcoes?.precoMax,
            limite: 3,
        })
        todosResultados.push(...produtos)
    }

    // Remove duplicados e limita
    const unicos = todosResultados.filter((p, i, arr) =>
        arr.findIndex(x => x.id === p.id) === i
    )

    return unicos.slice(0, opcoes?.limite || 5)
}

// Extrai marca do nome do produto
function extrairMarcaProduto(nome: string): string {
    const marcas = ['Pirelli', 'Goodyear', 'Michelin', 'Bridgestone', 'Continental', 'Firestone', 'Dunlop', 'Yokohama', 'Hankook', 'Kumho']

    for (const marca of marcas) {
        if (nome.toLowerCase().includes(marca.toLowerCase())) {
            return marca
        }
    }

    return 'Seminovo'
}

// Extrai medida do nome do produto
function extrairMedidaProduto(nome: string): string {
    const medidaRegex = /(\d{3})[\/\\](\d{2})\s*r?\s*(\d{2})/i
    const match = nome.match(medidaRegex)

    if (match) {
        return `${match[1]}/${match[2]} R${match[3]}`
    }

    return ''
}

// Formata produto para exibição no WhatsApp
export function formatarProdutoWhatsApp(produto: ProdutoRecomendado, posicao?: number): string {
    const prefix = posicao ? `${posicao}. ` : ''
    const destaque = produto.destaque ? '⭐ ' : ''

    let texto = `${prefix}${destaque}*${produto.nome}*\n`
    texto += `   💰 R$ ${produto.preco.toFixed(2)}\n`
    texto += `   📦 ${produto.estoque} em estoque`

    return texto
}

// Formata lista de produtos para WhatsApp
export function formatarListaProdutosWhatsApp(produtos: ProdutoRecomendado[]): string {
    if (produtos.length === 0) {
        return 'Não encontrei produtos disponíveis com esses critérios no momento.'
    }

    let texto = '🛞 *Opções disponíveis:*\n\n'

    produtos.forEach((p, i) => {
        texto += formatarProdutoWhatsApp(p, i + 1)
        if (i < produtos.length - 1) texto += '\n\n'
    })

    return texto
}
