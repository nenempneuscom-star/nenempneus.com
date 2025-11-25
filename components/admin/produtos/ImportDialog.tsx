'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Eye
} from 'lucide-react'
import { validateFile, type ProdutoImportData } from '@/lib/import-validation'
import { useRouter } from 'next/navigation'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PreviewResult {
  success: boolean
  preview: boolean
  summary: {
    total: number
    valid?: number
    invalid?: number
    imported?: number
    failed?: number
  }
  products?: ProdutoImportData[]
  validProducts?: ProdutoImportData[]
  invalidProducts?: { row: number; errors: string[] }[]
  errors?: string[]
  message?: string
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setPreviewResult(null)

    // Validar arquivo no frontend
    const validation = validateFile(selectedFile)
    if (!validation.valid) {
      setError(validation.error || 'Arquivo inválido')
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/produtos/template/download')
      if (!response.ok) {
        throw new Error('Erro ao baixar modelo')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `modelo_importacao_produtos_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('Erro ao baixar modelo')
      console.error(err)
    }
  }

  const handlePreview = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setPreviewResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('dryRun', 'true')

      const response = await fetch('/api/produtos/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Erro ao processar arquivo')
        return
      }

      setPreviewResult(result)
    } catch (err) {
      setError('Erro ao processar arquivo')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('dryRun', 'false')

      const response = await fetch('/api/produtos/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Erro ao importar produtos')
        return
      }

      // Sucesso!
      setPreviewResult(result)

      // Aguardar um pouco e fechar o modal
      setTimeout(() => {
        onOpenChange(false)
        router.refresh()
        // Reset states
        setFile(null)
        setPreviewResult(null)
      }, 2000)
    } catch (err) {
      setError('Erro ao importar produtos')
      console.error(err)
    } finally {
      setImporting(false)
    }
  }

  const resetDialog = () => {
    setFile(null)
    setPreviewResult(null)
    setError(null)
    setUploading(false)
    setImporting(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen)
      if (!isOpen) resetDialog()
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importação em Massa de Produtos
          </DialogTitle>
          <DialogDescription>
            Importe múltiplos produtos de uma vez usando nosso modelo Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Passo 1: Download do Modelo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  1
                </div>
                Baixar Modelo Excel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Baixe o modelo com instruções e preencha com seus produtos
              </p>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Modelo (.xlsx)
              </Button>
            </CardContent>
          </Card>

          {/* Passo 2: Upload do Arquivo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  2
                </div>
                Fazer Upload do Arquivo Preenchido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="file-upload">Selecione o arquivo Excel (.xlsx)</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={uploading || importing}
                />

                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>{file.name}</span>
                    <Badge variant="outline">
                      {(file.size / 1024).toFixed(2)} KB
                    </Badge>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={handlePreview}
                  disabled={!file || uploading || importing}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar Preview
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Passo 3: Preview dos Resultados */}
          {previewResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    3
                  </div>
                  {previewResult.success && !previewResult.preview ? 'Importação Concluída!' : 'Preview da Importação'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resumo */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{previewResult.summary.total}</div>
                    <div className="text-xs text-muted-foreground">Total de Linhas</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {previewResult.summary.valid || previewResult.summary.imported || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {previewResult.preview ? 'Válidos' : 'Importados'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {previewResult.summary.invalid || previewResult.summary.failed || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {previewResult.preview ? 'Inválidos' : 'Falhados'}
                    </div>
                  </div>
                </div>

                {/* Mensagem de Sucesso */}
                {previewResult.success && previewResult.message && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                    {previewResult.message}
                  </div>
                )}

                {/* Lista de Erros */}
                {previewResult.invalidProducts && previewResult.invalidProducts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Erros Encontrados:
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-red-50 rounded-lg">
                      {previewResult.invalidProducts.map((item, idx) => (
                        <div key={idx} className="text-xs text-red-700">
                          <span className="font-medium">Linha {item.row}:</span>{' '}
                          {item.errors.join(', ')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview de Produtos Válidos */}
                {previewResult.preview && previewResult.products && previewResult.products.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Produtos que serão importados ({previewResult.products.length}):
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {previewResult.products.slice(0, 10).map((produto, idx) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                          <div className="font-medium">{produto.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {produto.marca} • R$ {produto.preco.toFixed(2)} • Qtd: {produto.quantidade} • {produto.categoria}
                          </div>
                        </div>
                      ))}
                      {previewResult.products.length > 10 && (
                        <div className="text-xs text-center text-muted-foreground py-2">
                          ... e mais {previewResult.products.length - 10} produtos
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>

          {previewResult?.success && previewResult.preview && (
            <Button
              onClick={handleImport}
              disabled={importing || (previewResult.summary.valid === 0)}
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Confirmar Importação
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
