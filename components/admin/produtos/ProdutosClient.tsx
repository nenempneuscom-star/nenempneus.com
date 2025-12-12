'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Loader2,
  Filter,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MultiImageUpload } from '@/components/admin/MultiImageUpload'
import { ImportDialog } from '@/components/admin/produtos/ImportDialog'
import { useFeatureFlag } from '@/hooks/use-feature-flag'

interface Categoria {
  id: string
  nome: string
  slug: string
  descricao?: string | null
}

interface Produto {
  id: string
  nome: string
  slug: string
  descricao: string | null
  preco: number
  estoque: number
  imagemUrl: string | null
  imagens: string[]
  specs: Record<string, string>
  veiculos: string[]
  ativo: boolean
  destaque: boolean
  categoria: Categoria
  createdAt: string
  updatedAt: string
}

interface ProdutosClientProps {
  initialProdutos: Produto[]
  categorias: Categoria[]
  total: number
  pages: number
  currentPage: number
}

export function ProdutosClient({
  initialProdutos,
  categorias,
  total,
  pages,
  currentPage,
}: ProdutosClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [produtos, setProdutos] = useState(initialProdutos)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoriaFiltro, setCategoriaFiltro] = useState(searchParams.get('categoriaId') || '')

  // Sincronizar produtos quando initialProdutos mudar (após navegação)
  useEffect(() => {
    setProdutos(initialProdutos)
  }, [initialProdutos])

  // Sincronizar filtros com URL
  useEffect(() => {
    setSearch(searchParams.get('search') || '')
    setCategoriaFiltro(searchParams.get('categoriaId') || '')
  }, [searchParams])

  // Feature flag para importação em massa
  const importacaoHabilitada = useFeatureFlag('importacaoEmMassa')

  // Modal states
  const [modalAberto, setModalAberto] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [deletando, setDeletando] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Produto | null>(null)

  // Form states
  const [formNome, setFormNome] = useState('')
  const [formCategoria, setFormCategoria] = useState('')
  const [formPreco, setFormPreco] = useState('')
  const [formEstoque, setFormEstoque] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formImagens, setFormImagens] = useState<string[]>([])
  const [formAtivo, setFormAtivo] = useState(true)
  const [formDestaque, setFormDestaque] = useState(false)
  // Specs para pneus
  const [formMarca, setFormMarca] = useState('')
  const [formModelo, setFormModelo] = useState('')
  const [formAro, setFormAro] = useState('')
  const [formLargura, setFormLargura] = useState('')
  const [formPerfil, setFormPerfil] = useState('')
  const [formSulco, setFormSulco] = useState('')

  const handleBuscar = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoriaFiltro) params.set('categoriaId', categoriaFiltro)
    router.push(`/dashboard/produtos?${params.toString()}`)
  }

  const limparFiltros = () => {
    setSearch('')
    setCategoriaFiltro('')
    router.push('/dashboard/produtos')
  }

  const abrirModalNovo = () => {
    setProdutoEditando(null)
    setFormNome('')
    setFormCategoria(categorias[0]?.id || '')
    setFormPreco('')
    setFormEstoque('0')
    setFormDescricao('')
    setFormImagens([])
    setFormAtivo(true)
    setFormDestaque(false)
    setFormMarca('')
    setFormModelo('')
    setFormAro('')
    setFormLargura('')
    setFormPerfil('')
    setFormSulco('')
    setModalAberto(true)
  }

  const abrirModalEditar = (produto: Produto) => {
    setProdutoEditando(produto)
    setFormNome(produto.nome)
    setFormCategoria(produto.categoria.id)
    setFormPreco(produto.preco.toString())
    setFormEstoque(produto.estoque.toString())
    setFormDescricao(produto.descricao || '')
    setFormImagens(produto.imagens || [])
    setFormAtivo(produto.ativo)
    setFormDestaque(produto.destaque)
    setFormMarca(produto.specs?.marca || '')
    setFormModelo(produto.specs?.modelo || '')
    setFormAro(produto.specs?.aro || '')
    setFormLargura(produto.specs?.largura || '')
    setFormPerfil(produto.specs?.perfil || '')
    setFormSulco(produto.specs?.sulco || '')
    setModalAberto(true)
  }

  const salvarProduto = async () => {
    if (!formNome || !formCategoria || !formPreco) {
      alert('Preencha nome, categoria e preco')
      return
    }

    setSalvando(true)

    try {
      const specs: Record<string, string> = {}
      if (formMarca) specs.marca = formMarca
      if (formModelo) specs.modelo = formModelo
      if (formAro) specs.aro = formAro
      if (formLargura) specs.largura = formLargura
      if (formPerfil) specs.perfil = formPerfil
      if (formSulco) specs.sulco = formSulco

      const payload = {
        nome: formNome,
        categoriaId: formCategoria,
        preco: parseFloat(formPreco),
        estoque: parseInt(formEstoque) || 0,
        descricao: formDescricao || null,
        imagens: formImagens,
        ativo: formAtivo,
        destaque: formDestaque,
        specs,
      }

      const url = produtoEditando
        ? `/api/admin/produtos/${produtoEditando.id}`
        : '/api/admin/produtos'

      const response = await fetch(url, {
        method: produtoEditando ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        setModalAberto(false)

        // Atualizar lista local imediatamente
        if (produtoEditando) {
          // Edição: atualizar produto existente
          setProdutos(prev => prev.map(p =>
            p.id === produtoEditando.id ? { ...p, ...data.produto } : p
          ))
        } else {
          // Criação: adicionar novo produto
          setProdutos(prev => [data.produto, ...prev])
        }

        // Refresh para garantir sincronização
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao salvar produto')
      }
    } catch (err) {
      console.error('Erro ao salvar:', err)
      alert('Erro ao salvar produto')
    } finally {
      setSalvando(false)
    }
  }

  const deletarProduto = async (produto: Produto) => {
    setDeletando(produto.id)

    try {
      const response = await fetch(`/api/admin/produtos/${produto.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProdutos((prev) => prev.filter((p) => p.id !== produto.id))
        setConfirmDelete(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao deletar produto')
      }
    } catch (err) {
      console.error('Erro ao deletar:', err)
      alert('Erro ao deletar produto')
    } finally {
      setDeletando(null)
    }
  }

  const toggleAtivo = async (produto: Produto) => {
    try {
      const response = await fetch(`/api/admin/produtos/${produto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !produto.ativo }),
      })

      if (response.ok) {
        setProdutos((prev) =>
          prev.map((p) =>
            p.id === produto.id ? { ...p, ativo: !p.ativo } : p
          )
        )
      }
    } catch (err) {
      console.error('Erro ao atualizar:', err)
    }
  }

  const toggleDestaque = async (produto: Produto) => {
    try {
      const response = await fetch(`/api/admin/produtos/${produto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destaque: !produto.destaque }),
      })

      if (response.ok) {
        setProdutos((prev) =>
          prev.map((p) =>
            p.id === produto.id ? { ...p, destaque: !p.destaque } : p
          )
        )
      }
    } catch (err) {
      console.error('Erro ao atualizar:', err)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground">
            Gerencie o catalogo de pneus da loja. {total} produto(s) cadastrado(s).
          </p>
        </div>
        <div className="flex gap-2">
          {importacaoHabilitada && (
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar Excel
            </Button>
          )}
          <Button onClick={abrirModalNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Buscar</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                />
              </div>
            </div>
            <div className="w-[200px]">
              <Label>Categoria</Label>
              <Select
                value={categoriaFiltro || 'all'}
                onValueChange={(value) => setCategoriaFiltro(value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleBuscar}>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
            {(search || categoriaFiltro) && (
              <Button variant="ghost" onClick={limparFiltros}>
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      {produtos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum produto encontrado.</p>
            <Button className="mt-4" onClick={abrirModalNovo}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar primeiro produto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produtos.map((produto) => (
            <Card
              key={produto.id}
              className={`relative ${!produto.ativo ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {produto.nome}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {produto.categoria.nome}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {produto.destaque && (
                      <Badge variant="default" className="bg-yellow-500">
                        <Star className="h-3 w-3" />
                      </Badge>
                    )}
                    {!produto.ativo && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preco:</span>
                    <span className="font-bold text-primary">
                      R$ {produto.preco.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estoque:</span>
                    <span
                      className={
                        produto.estoque <= 5
                          ? 'text-red-500 font-medium'
                          : ''
                      }
                    >
                      {produto.estoque} un.
                    </span>
                  </div>
                  {produto.specs?.aro && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Aro:</span>
                      <span>{produto.specs.aro}"</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-1 mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => abrirModalEditar(produto)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAtivo(produto)}
                    title={produto.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {produto.ativo ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDestaque(produto)}
                    title={produto.destaque ? 'Remover destaque' : 'Destacar'}
                  >
                    {produto.destaque ? (
                      <StarOff className="h-4 w-4" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete(produto)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginacao */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const params = new URLSearchParams()
                if (search) params.set('search', search)
                if (categoriaFiltro) params.set('categoriaId', categoriaFiltro)
                params.set('page', page.toString())
                router.push(`/dashboard/produtos?${params.toString()}`)
              }}
            >
              {page}
            </Button>
          ))}
        </div>
      )}

      {/* Modal Criar/Editar */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do pneu abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Pneu Pirelli Cinturato P1"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select value={formCategoria} onValueChange={setFormCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preco">Preco (R$) *</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  placeholder="299.90"
                  value={formPreco}
                  onChange={(e) => setFormPreco(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque">Estoque</Label>
                <Input
                  id="estoque"
                  type="number"
                  placeholder="10"
                  value={formEstoque}
                  onChange={(e) => setFormEstoque(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descricao</Label>
              <Textarea
                id="descricao"
                placeholder="Descricao do produto..."
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Fotos do Produto (até 3)</Label>
              <MultiImageUpload
                value={formImagens}
                onChange={setFormImagens}
                maxImages={3}
                bucket="produtos"
                folder="pneus"
                maxSizeMB={0.5}
                maxWidthOrHeight={800}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Especificacoes do Pneu</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    placeholder="Pirelli"
                    value={formMarca}
                    onChange={(e) => setFormMarca(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    placeholder="Cinturato P1"
                    value={formModelo}
                    onChange={(e) => setFormModelo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aro">Aro</Label>
                  <Input
                    id="aro"
                    placeholder="15"
                    value={formAro}
                    onChange={(e) => setFormAro(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="largura">Largura</Label>
                  <Input
                    id="largura"
                    placeholder="195"
                    value={formLargura}
                    onChange={(e) => setFormLargura(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perfil">Perfil</Label>
                  <Input
                    id="perfil"
                    placeholder="65"
                    value={formPerfil}
                    onChange={(e) => setFormPerfil(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sulco">Sulco (mm)</Label>
                  <Input
                    id="sulco"
                    placeholder="8"
                    value={formSulco}
                    onChange={(e) => setFormSulco(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAtivo}
                  onChange={(e) => setFormAtivo(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Produto ativo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formDestaque}
                  onChange={(e) => setFormDestaque(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Produto em destaque</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarProduto} disabled={salvando}>
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {produtoEditando ? 'Salvar' : 'Criar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Delete */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto "{confirmDelete?.nome}"?
              Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && deletarProduto(confirmDelete)}
              disabled={deletando === confirmDelete?.id}
            >
              {deletando === confirmDelete?.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Importação */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </>
  )
}
