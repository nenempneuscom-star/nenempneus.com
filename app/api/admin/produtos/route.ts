import { NextRequest, NextResponse } from 'next/server'
import { getProdutos, getCategorias, criarProduto } from '@/lib/admin/produtos'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoriaId = searchParams.get('categoriaId') || undefined
    const search = searchParams.get('search') || undefined
    const ativo = searchParams.get('ativo')
    const destaque = searchParams.get('destaque')
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20

    const { produtos, total, pages } = await getProdutos({
      categoriaId,
      search,
      ativo: ativo !== null ? ativo === 'true' : undefined,
      destaque: destaque !== null ? destaque === 'true' : undefined,
      page,
      limit,
    })

    return NextResponse.json({ produtos, total, pages })
  } catch (error: any) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar produtos' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    // Validacoes basicas
    if (!data.nome || !data.categoriaId || data.preco === undefined) {
      return NextResponse.json(
        { error: 'Nome, categoria e preco sao obrigatorios' },
        { status: 400 }
      )
    }

    const produto = await criarProduto({
      nome: data.nome,
      categoriaId: data.categoriaId,
      preco: Number(data.preco),
      estoque: data.estoque ? Number(data.estoque) : 0,
      descricao: data.descricao,
      imagemUrl: data.imagemUrl,
      imagens: data.imagens,
      specs: data.specs,
      veiculos: data.veiculos,
      ativo: data.ativo,
      destaque: data.destaque,
    })

    return NextResponse.json({ success: true, produto })
  } catch (error: any) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar produto' },
      { status: 500 }
    )
  }
}
