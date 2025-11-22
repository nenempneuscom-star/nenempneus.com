'use server'

import { db } from './db'
import { LOJA_SLUG } from './constants'

export async function getProdutosDestaque() {
    try {
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) {
            throw new Error('Loja não encontrada')
        }

        const produtos = await db.produto.findMany({
            where: {
                lojaId: loja.id,
                ativo: true,
                destaque: true,
            },
            take: 4,
            orderBy: {
                createdAt: 'desc',
            },
        })

        return produtos
    } catch (error) {
        console.error('Erro ao buscar produtos:', error)
        return []
    }
}

// Buscar produtos com filtros
export async function getProdutos(filtros?: {
    marca?: string
    aro?: string
    precoMin?: number
    precoMax?: number
}) {
    try {
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) {
            throw new Error('Loja não encontrada')
        }

        const where: any = {
            lojaId: loja.id,
            ativo: true,
        }

        // Filtrar por marca
        if (filtros?.marca && filtros.marca !== 'all') {
            where.specs = {
                path: ['marca'],
                equals: filtros.marca,
            }
        }

        // Filtrar por aro
        if (filtros?.aro && filtros.aro !== 'all') {
            where.specs = {
                ...where.specs,
                path: ['aro'],
                equals: filtros.aro,
            }
        }

        // Filtrar por preço
        if (filtros?.precoMin !== undefined) {
            where.preco = { gte: filtros.precoMin }
        }
        if (filtros?.precoMax !== undefined) {
            where.preco = { ...where.preco, lte: filtros.precoMax }
        }

        const produtos = await db.produto.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
        })

        return produtos
    } catch (error) {
        console.error('Erro ao buscar produtos (usando mock):', error)
        // Fallback para dados mockados
        return [
            {
                id: 'mock-1',
                nome: 'Pirelli P4 175/70R14 (Mock)',
                slug: 'pirelli-p4-175-70-r14',
                preco: 380,
                estoque: 8,
                specs: { marca: 'Pirelli', modelo: 'P4', aro: '14', largura: '175', perfil: '70', sulco: '7mm' }
            },
            {
                id: 'mock-2',
                nome: 'Goodyear EfficientGrip 185/65R15 (Mock)',
                slug: 'goodyear-efficientgrip-185-65-r15',
                preco: 420,
                estoque: 6,
                specs: { marca: 'Goodyear', modelo: 'EfficientGrip', aro: '15', largura: '185', perfil: '65', sulco: '6.5mm' }
            },
            {
                id: 'mock-3',
                nome: 'Michelin Primacy 195/55R16 (Mock)',
                slug: 'michelin-primacy-195-55-r16',
                preco: 520,
                estoque: 4,
                specs: { marca: 'Michelin', modelo: 'Primacy', aro: '16', largura: '195', perfil: '55', sulco: '8mm' }
            },
            {
                id: 'mock-4',
                nome: 'Bridgestone Turanza 205/60R16 (Mock)',
                slug: 'bridgestone-turanza-205-60-r16',
                preco: 480,
                estoque: 5,
                specs: { marca: 'Bridgestone', modelo: 'Turanza', aro: '16', largura: '205', perfil: '60', sulco: '7mm' }
            },
            {
                id: 'mock-5',
                nome: 'Continental ContiPremiumContact 225/45R17 (Mock)',
                slug: 'continental-contipremiumcontact-225-45-r17',
                preco: 600,
                estoque: 3,
                specs: { marca: 'Continental', modelo: 'ContiPremiumContact', aro: '17', largura: '225', perfil: '45', sulco: '7.5mm' }
            }
        ]
    }
}

// Obter marcas únicas
export async function getMarcas() {
    try {
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) return []

        const produtos = await db.produto.findMany({
            where: {
                lojaId: loja.id,
                ativo: true,
            },
            select: {
                specs: true,
            },
        })

        const marcas = new Set<string>()
        produtos.forEach((p: any) => {
            if (p.specs?.marca) {
                marcas.add(p.specs.marca)
            }
        })

        return Array.from(marcas).sort()
    } catch (error) {
        console.error('Erro ao buscar marcas (usando mock):', error)
        return ['Pirelli', 'Goodyear', 'Michelin', 'Bridgestone', 'Continental']
    }
}

// Obter aros únicos
export async function getAros() {
    try {
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) return []

        const produtos = await db.produto.findMany({
            where: {
                lojaId: loja.id,
                ativo: true,
            },
            select: {
                specs: true,
            },
        })

        const aros = new Set<string>()
        produtos.forEach((p: any) => {
            if (p.specs?.aro) {
                aros.add(p.specs.aro)
            }
        })

        return Array.from(aros).sort((a, b) => parseInt(a) - parseInt(b))
    } catch (error) {
        console.error('Erro ao buscar aros (usando mock):', error)
        return ['14', '15', '16', '17']
    }
}

// Criar pedido
export async function criarPedido(dados: {
    cliente: any
    items: any[]
    subtotal: number
    total: number
    observacoes?: string
}) {
    try {
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) {
            throw new Error('Loja não encontrada')
        }

        // 1. Criar ou buscar cliente
        let cliente = await db.cliente.findFirst({
            where: {
                lojaId: loja.id,
                email: dados.cliente.email,
            },
        })

        if (!cliente) {
            cliente = await db.cliente.create({
                data: {
                    lojaId: loja.id,
                    nome: dados.cliente.nome,
                    email: dados.cliente.email,
                    telefone: dados.cliente.telefone,
                    cpf: dados.cliente.cpf,
                    veiculoMarca: dados.cliente.veiculoMarca,
                    veiculoModelo: dados.cliente.veiculoModelo,
                    veiculoAno: dados.cliente.veiculoAno ? parseInt(dados.cliente.veiculoAno) : null,
                    veiculoPlaca: dados.cliente.veiculoPlaca,
                },
            })
        }

        // 2. Gerar número do pedido
        const numeroPedido = `PED-${Date.now()}`

        // 3. Criar pedido
        const pedido = await db.pedido.create({
            data: {
                lojaId: loja.id,
                clienteId: cliente.id,
                numero: numeroPedido,
                subtotal: dados.subtotal,
                desconto: 0,
                total: dados.total,
                status: 'pendente',
                observacoes: dados.observacoes,
                items: {
                    create: dados.items.map((item) => ({
                        produtoId: item.id,
                        quantidade: item.quantidade,
                        precoUnit: item.preco,
                        subtotal: item.preco * item.quantidade,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        produto: true,
                    },
                },
            },
        })

        return { success: true, pedido }
    } catch (error) {
        console.error('Erro ao criar pedido:', error)
        return { success: false, error: 'Erro ao criar pedido' }
    }
}

// Buscar produto por slug
export async function getProdutoPorSlug(slug: string) {
    try {
        const loja = await db.loja.findUnique({
            where: { slug: LOJA_SLUG },
        })

        if (!loja) {
            throw new Error('Loja não encontrada')
        }

        const produto = await db.produto.findUnique({
            where: {
                lojaId_slug: {
                    lojaId: loja.id,
                    slug: slug,
                },
            },
            include: {
                categoria: true,
            },
        })

        return produto
    } catch (error) {
        console.error('Erro ao buscar produto:', error)
        return null
    }
}
