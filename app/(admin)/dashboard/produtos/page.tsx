import { getProdutos, getCategorias } from '@/lib/admin/produtos'
import { ProdutosClient } from '@/components/admin/produtos/ProdutosClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    categoriaId?: string
    search?: string
    page?: string
  }>
}

export default async function ProdutosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1

  const [{ produtos, total, pages }, categorias] = await Promise.all([
    getProdutos({
      categoriaId: params.categoriaId,
      search: params.search,
      page,
      limit: 20,
    }),
    getCategorias(),
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <ProdutosClient
        initialProdutos={produtos}
        categorias={categorias}
        total={total}
        pages={pages}
        currentPage={page}
      />
    </div>
  )
}
