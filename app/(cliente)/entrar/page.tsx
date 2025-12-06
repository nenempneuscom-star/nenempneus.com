'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CreditCard } from 'lucide-react'

export default function EntrarPage() {
  const router = useRouter()
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatarCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatarCPF(e.target.value))
    setError('')
  }

  const handleEntrar = async () => {
    const cpfNumeros = cpf.replace(/\D/g, '')
    if (cpfNumeros.length !== 11) {
      setError('Digite um CPF valido com 11 digitos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/cliente/auth/login-cpf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfNumeros }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'CPF nao encontrado. Faca uma compra para se cadastrar.')
        return
      }

      router.push('/minha-conta')
      router.refresh()
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary">
              Nenem <span className="text-foreground">Pneus</span>
            </h1>
          </Link>
          <p className="text-muted-foreground mt-2">Area do Cliente</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar na sua conta</CardTitle>
            <CardDescription>
              Digite seu CPF para acessar sua area do cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCPFChange}
                  className="pl-10"
                  maxLength={14}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleEntrar()
                    }
                  }}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              className="w-full"
              onClick={handleEntrar}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Entrar
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Seu CPF e cadastrado automaticamente ao fazer uma compra
            </p>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="text-center mt-6 space-y-2">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    </div>
  )
}
