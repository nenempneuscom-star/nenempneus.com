'use client'

import { useState, useCallback, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { Upload, X, Loader2, ImageIcon, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  bucket?: string
  folder?: string
  maxSizeMB?: number
  maxWidthOrHeight?: number
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  bucket = 'produtos',
  folder = 'images',
  maxSizeMB = 0.5,
  maxWidthOrHeight = 800,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [progress, setProgress] = useState<{
    original: number
    compressed: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const compressAndUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      setError(null)
      setProgress(null)

      try {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          throw new Error('Arquivo deve ser uma imagem')
        }

        const originalSize = file.size / 1024 / 1024 // MB

        // Comprimir imagem para JPEG (compatível com WhatsApp)
        const options = {
          maxSizeMB,
          maxWidthOrHeight,
          useWebWorker: true,
          fileType: 'image/jpeg' as const,
          initialQuality: 0.85,
        }

        const compressedFile = await imageCompression(file, options)
        const compressedSize = compressedFile.size / 1024 / 1024 // MB

        setProgress({
          original: originalSize,
          compressed: compressedSize,
        })

        // Gerar nome unico para o arquivo
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const fileName = `${folder}/${timestamp}-${randomId}.jpg`

        // Upload para Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, compressedFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw uploadError
        }

        // Obter URL publica
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(data.path)

        onChange(publicUrl)
      } catch (err) {
        console.error('Erro no upload:', err)
        setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
      } finally {
        setUploading(false)
      }
    },
    [bucket, folder, maxSizeMB, maxWidthOrHeight, onChange]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        compressAndUpload(e.dataTransfer.files[0])
      }
    },
    [compressAndUpload]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        compressAndUpload(e.target.files[0])
      }
    },
    [compressAndUpload]
  )

  const handleRemove = useCallback(() => {
    onChange(null)
    setProgress(null)
    setError(null)
  }, [onChange])

  return (
    <div className={cn('space-y-2', className)}>
      {/* Area de upload ou preview */}
      {value ? (
        // Preview da imagem
        <div className="relative group">
          <div className="relative aspect-square w-full max-w-[200px] rounded-lg overflow-hidden border bg-muted">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4 mr-1" />
                Remover
              </Button>
            </div>
          </div>
          {progress && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {progress.original.toFixed(2)}MB → {progress.compressed.toFixed(2)}MB
              <span className="text-green-500">
                (-{Math.round((1 - progress.compressed / progress.original) * 100)}%)
              </span>
            </p>
          )}
        </div>
      ) : (
        // Area de drag & drop
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center w-full max-w-[200px] aspect-square',
            'border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            'hover:border-primary hover:bg-primary/5',
            dragActive && 'border-primary bg-primary/10',
            error && 'border-destructive',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs">Comprimindo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
              {dragActive ? (
                <>
                  <Upload className="h-8 w-8 text-primary" />
                  <span className="text-xs">Solte aqui!</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-xs">
                    Arraste uma imagem ou clique para selecionar
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    JPG, PNG, WebP (max {maxSizeMB * 2}MB)
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mensagem de erro */}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
