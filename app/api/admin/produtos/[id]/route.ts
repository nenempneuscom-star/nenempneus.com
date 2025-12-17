import { NextRequest, NextResponse } from 'next/server'
import { getProdutoById, atualizarProduto, deletarProduto } from '@/lib/admin/produtos'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const produto = await getProdutoById(id)

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ produto })
  } catch (error: any) {
    console.error('Erro ao buscar produto:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar produto' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await req.json()

    const produto = await atualizarProduto(id, {
      nome: data.nome,
      categoriaId: data.categoriaId,
      preco: data.preco !== undefined ? Number(data.preco) : undefined,
      estoque: data.estoque !== undefined ? Number(data.estoque) : undefined,
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
    console.error('Erro ao atualizar produto:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar produto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await deletarProduto(id)

    // Retorna mensagem diferente se foi desativado ao invés de deletado
    if (result.action === 'deactivated') {
      return NextResponse.json({
        success: true,
        message: 'Produto desativado (possui pedidos vinculados)',
        action: 'deactivated'
      })
    }

    return NextResponse.json({ success: true, action: 'deleted' })
  } catch (error: any) {
    console.error('Erro ao deletar produto:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar produto' },
      { status: 500 }
    )
  }
}
