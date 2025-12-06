'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, Phone, Mail, CreditCard, Loader2, CheckCircle } from 'lucide-react'

interface DadosCliente {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  cpf: string | null
  totalCompras?: number
  pontos?: number
}

export default function MeusDadosPage() {
  const [dados, setDados] = useState<DadosCliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  // Form states
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const res = await fetch('/api/cliente/me')
      if (res.ok) {
        const data = await res.json()
        setDados(data.cliente)
        setNome(data.cliente.nome || '')
        setEmail(data.cliente.email || '')
        setCpf(formatarCPF(data.cliente.cpf || ''))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatarCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatarCPF(e.target.value))
  }

  const salvarDados = async () => {
    setSalvando(true)
    setSucesso(false)

    try {
      const res = await fetch('/api/cliente/dados', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email: email || null,
          cpf: cpf.replace(/\D/g, '') || null,
        }),
      })

      if (res.ok) {
        setSucesso(true)
        setTimeout(() => setSucesso(false), 3000)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao salvar dados')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar dados')
    } finally {
      setSalvando(false)
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
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Meus Dados</h1>
        <p className="text-muted-foreground">
          Gerencie suas informacoes pessoais
        </p>
      </div>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Dados Pessoais
          </CardTitle>
          <CardDescription>
            Suas informacoes basicas de cadastro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="telefone"
                value={dados?.telefone || ''}
                disabled
                className="pl-10 bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              O telefone nao pode ser alterado pois e usado para login
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cpf"
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                className="pl-10"
                maxLength={14}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-4">
            <Button onClick={salvarDados} disabled={salvando}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar Alteracoes
            </Button>
            {sucesso && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Dados salvos com sucesso!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatisticas */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">
                {dados?.totalCompras || 0}
              </p>
              <p className="text-sm text-muted-foreground">Compras realizadas</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">
                {dados?.pontos || 0}
              </p>
              <p className="text-sm text-muted-foreground">Pontos acumulados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre a conta */}
      <div className="text-center pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Para solicitar a exclusao da sua conta, envie um email para{' '}
          <a href="mailto:contato@nenempneus.com" className="text-primary hover:underline">
            contato@nenempneus.com
          </a>
        </p>
      </div>
    </div>
  )
}
