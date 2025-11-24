'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Car, Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react'

interface Veiculo {
  id: string
  apelido: string | null
  marca: string
  modelo: string
  ano: number | null
  placa: string | null
  cor: string | null
  principal: boolean
}

export default function MeusVeiculosPage() {
  const router = useRouter()
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Veiculo | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [deletando, setDeletando] = useState<string | null>(null)

  // Form states
  const [apelido, setApelido] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [ano, setAno] = useState('')
  const [placa, setPlaca] = useState('')
  const [cor, setCor] = useState('')
  const [principal, setPrincipal] = useState(false)

  useEffect(() => {
    carregarVeiculos()
  }, [])

  const carregarVeiculos = async () => {
    try {
      const res = await fetch('/api/cliente/veiculos')
      if (res.ok) {
        const data = await res.json()
        setVeiculos(data.veiculos)
      }
    } catch (error) {
      console.error('Erro ao carregar veiculos:', error)
    } finally {
      setLoading(false)
    }
  }

  const abrirModalNovo = () => {
    setEditando(null)
    setApelido('')
    setMarca('')
    setModelo('')
    setAno('')
    setPlaca('')
    setCor('')
    setPrincipal(veiculos.length === 0)
    setModalAberto(true)
  }

  const abrirModalEditar = (veiculo: Veiculo) => {
    setEditando(veiculo)
    setApelido(veiculo.apelido || '')
    setMarca(veiculo.marca)
    setModelo(veiculo.modelo)
    setAno(veiculo.ano?.toString() || '')
    setPlaca(veiculo.placa || '')
    setCor(veiculo.cor || '')
    setPrincipal(veiculo.principal)
    setModalAberto(true)
  }

  const salvarVeiculo = async () => {
    if (!marca || !modelo) {
      alert('Preencha marca e modelo')
      return
    }

    setSalvando(true)

    try {
      const payload = {
        apelido: apelido || null,
        marca,
        modelo,
        ano: ano ? parseInt(ano) : null,
        placa: placa || null,
        cor: cor || null,
        principal,
      }

      const url = editando
        ? `/api/cliente/veiculos/${editando.id}`
        : '/api/cliente/veiculos'

      const res = await fetch(url, {
        method: editando ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setModalAberto(false)
        carregarVeiculos()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao salvar veiculo')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar veiculo')
    } finally {
      setSalvando(false)
    }
  }

  const deletarVeiculo = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este veiculo?')) return

    setDeletando(id)

    try {
      const res = await fetch(`/api/cliente/veiculos/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setVeiculos((prev) => prev.filter((v) => v.id !== id))
      } else {
        alert('Erro ao remover veiculo')
      }
    } catch (error) {
      console.error('Erro ao deletar:', error)
    } finally {
      setDeletando(null)
    }
  }

  const definirPrincipal = async (id: string) => {
    try {
      await fetch(`/api/cliente/veiculos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principal: true }),
      })
      carregarVeiculos()
    } catch (error) {
      console.error('Erro ao definir principal:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Veiculos</h1>
          <p className="text-muted-foreground">
            Cadastre seus veiculos para facilitar a busca de pneus compativeis
          </p>
        </div>
        <Button onClick={abrirModalNovo}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Veiculo
        </Button>
      </div>

      {veiculos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Car className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum veiculo cadastrado</h3>
            <p className="text-muted-foreground text-center mb-6">
              Cadastre seus veiculos para receber recomendacoes de pneus personalizadas
            </p>
            <Button onClick={abrirModalNovo}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Veiculo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {veiculos.map((veiculo) => (
            <Card
              key={veiculo.id}
              className={`relative ${veiculo.principal ? 'border-primary' : ''}`}
            >
              {veiculo.principal && (
                <Badge className="absolute -top-2 -right-2 gap-1">
                  <Star className="h-3 w-3" />
                  Principal
                </Badge>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  {veiculo.apelido || `${veiculo.marca} ${veiculo.modelo}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marca:</span>
                    <span className="font-medium">{veiculo.marca}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modelo:</span>
                    <span className="font-medium">{veiculo.modelo}</span>
                  </div>
                  {veiculo.ano && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ano:</span>
                      <span className="font-medium">{veiculo.ano}</span>
                    </div>
                  )}
                  {veiculo.placa && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Placa:</span>
                      <span className="font-medium">{veiculo.placa}</span>
                    </div>
                  )}
                  {veiculo.cor && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cor:</span>
                      <span className="font-medium">{veiculo.cor}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => abrirModalEditar(veiculo)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!veiculo.principal && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => definirPrincipal(veiculo.id)}
                      title="Definir como principal"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deletarVeiculo(veiculo.id)}
                    disabled={deletando === veiculo.id}
                  >
                    {deletando === veiculo.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Veiculo' : 'Novo Veiculo'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do seu veiculo
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apelido">Apelido (opcional)</Label>
              <Input
                id="apelido"
                placeholder="Ex: Meu Carro, Carro da Familia"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca *</Label>
                <Input
                  id="marca"
                  placeholder="Ex: Volkswagen"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo *</Label>
                <Input
                  id="modelo"
                  placeholder="Ex: Gol"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ano">Ano</Label>
                <Input
                  id="ano"
                  type="number"
                  placeholder="Ex: 2020"
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <Input
                  id="cor"
                  placeholder="Ex: Prata"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placa">Placa</Label>
              <Input
                id="placa"
                placeholder="Ex: ABC-1234"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={principal}
                onChange={(e) => setPrincipal(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Definir como veiculo principal</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarVeiculo} disabled={salvando}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editando ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
