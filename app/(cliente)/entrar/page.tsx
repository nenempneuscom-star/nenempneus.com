'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Phone, KeyRound, ArrowLeft, MessageSquare } from 'lucide-react'

export default function EntrarPage() {
  const router = useRouter()
  const [step, setStep] = useState<'telefone' | 'codigo'>('telefone')
  const [telefone, setTelefone] = useState('')
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatarTelefone(e.target.value))
    setError('')
  }

  const handleEnviarCodigo = async () => {
    const telefoneNumeros = telefone.replace(/\D/g, '')
    if (telefoneNumeros.length < 10) {
      setError('Digite um telefone valido')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/cliente/auth/enviar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: telefoneNumeros }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao enviar codigo')
        return
      }

      setStep('codigo')
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificarCodigo = async () => {
    if (codigo.length !== 6) {
      setError('Digite o codigo de 6 digitos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/cliente/auth/verificar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone: telefone.replace(/\D/g, ''),
          codigo,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Codigo invalido')
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
            <CardTitle className="flex items-center gap-2">
              {step === 'codigo' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setStep('telefone')
                    setCodigo('')
                    setError('')
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {step === 'telefone' ? 'Entrar na sua conta' : 'Verificar codigo'}
            </CardTitle>
            <CardDescription>
              {step === 'telefone'
                ? 'Digite seu telefone para receber um codigo de acesso via WhatsApp'
                : `Enviamos um codigo de 6 digitos para ${telefone}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'telefone' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="(48) 99999-9999"
                      value={telefone}
                      onChange={handleTelefoneChange}
                      className="pl-10"
                      maxLength={15}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  className="w-full"
                  onClick={handleEnviarCodigo}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Enviar codigo via WhatsApp
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Codigo de verificacao</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="codigo"
                      type="text"
                      placeholder="000000"
                      value={codigo}
                      onChange={(e) => {
                        setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))
                        setError('')
                      }}
                      className="pl-10 text-center text-2xl tracking-widest"
                      maxLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  className="w-full"
                  onClick={handleVerificarCodigo}
                  disabled={loading || codigo.length !== 6}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Verificar e entrar
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleEnviarCodigo}
                  disabled={loading}
                >
                  Reenviar codigo
                </Button>
              </>
            )}
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
