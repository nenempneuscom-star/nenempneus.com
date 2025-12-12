import { db } from '../db'
import { LOJA_SLUG } from '../constants'

export interface ProdutoFiltros {
  categoriaId?: string
  search?: string
  ativo?: boolean
  destaque?: boolean
  page?: number
  limit?: number
}

export async function getProdutos(filtros: ProdutoFiltros = {}) {
  const { categoriaId, search, ativo, destaque, page = 1, limit = 20 } = filtros

  const loja = await db.loja.findUnique({
    where: { slug: LOJA_SLUG },
  })

  if (!loja) {
    return { produtos: [], total: 0, pages: 0 }
  }

  const where: any = {
    lojaId: loja.id,
  }

  if (categoriaId) {
    where.categoriaId = categoriaId
  }

  if (search) {
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' } },
      { descricao: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (ativo !== undefined) {
    where.ativo = ativo
  }

  if (destaque !== undefined) {
    where.destaque = destaque
  }

  const [produtos, total] = await Promise.all([
    db.produto.findMany({
      where,
      include: {
        categoria: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.produto.count({ where }),
  ])

  const produtosFormatados = produtos.map((p) => ({
    id: p.id,
    nome: p.nome,
    slug: p.slug,
    descricao: p.descricao,
    preco: Number(p.preco),
    estoque: p.estoque,
    imagemUrl: p.imagemUrl,
    imagens: (p.imagens as string[]) || [],
    specs: p.specs as Record<string, string>,
    veiculos: p.veiculos as string[],
    ativo: p.ativo,
    destaque: p.destaque,
    categoria: p.categoria,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return {
    produtos: produtosFormatados,
    total,
    pages: Math.ceil(total / limit),
  }
}

export async function getProdutoById(id: string) {
  const produto = await db.produto.findUnique({
    where: { id },
    include: {
      categoria: true,
    },
  })

  if (!produto) return null

  return {
    id: produto.id,
    nome: produto.nome,
    slug: produto.slug,
    descricao: produto.descricao,
    preco: Number(produto.preco),
    estoque: produto.estoque,
    imagemUrl: produto.imagemUrl,
    imagens: (produto.imagens as string[]) || [],
    specs: produto.specs as Record<string, string>,
    veiculos: produto.veiculos as string[],
    ativo: produto.ativo,
    destaque: produto.destaque,
    categoriaId: produto.categoriaId,
    categoria: produto.categoria,
    createdAt: produto.createdAt.toISOString(),
    updatedAt: produto.updatedAt.toISOString(),
  }
}

export async function getCategorias() {
  const loja = await db.loja.findUnique({
    where: { slug: LOJA_SLUG },
  })

  if (!loja) return []

  const categorias = await db.categoria.findMany({
    where: { lojaId: loja.id, ativo: true },
    orderBy: { ordem: 'asc' },
  })

  return categorias.map((c) => ({
    id: c.id,
    nome: c.nome,
    slug: c.slug,
    descricao: c.descricao,
  }))
}

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function criarProduto(data: {
  nome: string
  categoriaId: string
  preco: number
  estoque?: number
  descricao?: string
  imagemUrl?: string
  imagens?: string[]
  specs?: Record<string, string>
  veiculos?: string[]
  ativo?: boolean
  destaque?: boolean
}) {
  const loja = await db.loja.findUnique({
    where: { slug: LOJA_SLUG },
  })

  if (!loja) {
    throw new Error('Loja nao encontrada')
  }

  const slug = gerarSlug(data.nome)

  // Verificar se slug ja existe
  const existente = await db.produto.findUnique({
    where: {
      lojaId_slug: {
        lojaId: loja.id,
        slug,
      },
    },
  })

  const slugFinal = existente ? `${slug}-${Date.now()}` : slug

  const produto = await db.produto.create({
    data: {
      lojaId: loja.id,
      categoriaId: data.categoriaId,
      nome: data.nome,
      slug: slugFinal,
      descricao: data.descricao || null,
      preco: data.preco,
      estoque: data.estoque || 0,
      imagemUrl: data.imagens?.[0] || data.imagemUrl || null,
      imagens: data.imagens || [],
      specs: data.specs || {},
      veiculos: data.veiculos || [],
      ativo: data.ativo ?? true,
      destaque: data.destaque ?? false,
    },
    include: {
      categoria: true,
    },
  })

  return {
    id: produto.id,
    nome: produto.nome,
    slug: produto.slug,
    preco: Number(produto.preco),
    estoque: produto.estoque,
    categoria: produto.categoria,
  }
}

export async function atualizarProduto(
  id: string,
  data: {
    nome?: string
    categoriaId?: string
    preco?: number
    estoque?: number
    descricao?: string
    imagemUrl?: string
    imagens?: string[]
    specs?: Record<string, string>
    veiculos?: string[]
    ativo?: boolean
    destaque?: boolean
  }
) {
  const updateData: any = {}

  // Só atualiza o slug se o nome realmente mudou
  if (data.nome !== undefined) {
    const produtoAtual = await db.produto.findUnique({ where: { id } })
    if (produtoAtual && data.nome !== produtoAtual.nome) {
      updateData.nome = data.nome
      updateData.slug = gerarSlug(data.nome)
    } else if (produtoAtual) {
      // Nome igual, não atualiza slug
      updateData.nome = data.nome
    }
  }
  if (data.categoriaId !== undefined) updateData.categoriaId = data.categoriaId
  if (data.preco !== undefined) updateData.preco = data.preco
  if (data.estoque !== undefined) updateData.estoque = data.estoque
  if (data.descricao !== undefined) updateData.descricao = data.descricao
  if (data.imagemUrl !== undefined) updateData.imagemUrl = data.imagemUrl
  if (data.imagens !== undefined) {
    updateData.imagens = data.imagens
    // Também atualiza imagemUrl com a primeira imagem para compatibilidade
    updateData.imagemUrl = data.imagens[0] || null
  }
  if (data.specs !== undefined) updateData.specs = data.specs
  if (data.veiculos !== undefined) updateData.veiculos = data.veiculos
  if (data.ativo !== undefined) updateData.ativo = data.ativo
  if (data.destaque !== undefined) updateData.destaque = data.destaque

  const produto = await db.produto.update({
    where: { id },
    data: updateData,
    include: {
      categoria: true,
    },
  })

  return {
    id: produto.id,
    nome: produto.nome,
    slug: produto.slug,
    preco: Number(produto.preco),
    estoque: produto.estoque,
    ativo: produto.ativo,
    categoria: produto.categoria,
  }
}

export async function deletarProduto(id: string) {
  await db.produto.delete({
    where: { id },
  })

  return { success: true }
}
