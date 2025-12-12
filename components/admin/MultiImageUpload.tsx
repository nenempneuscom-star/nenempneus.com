'use client'

import { useState, useCallback, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { Upload, X, Loader2, ImageIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MultiImageUploadProps {
    value: string[]
    onChange: (urls: string[]) => void
    maxImages?: number
    bucket?: string
    folder?: string
    maxSizeMB?: number
    maxWidthOrHeight?: number
    className?: string
}

export function MultiImageUpload({
    value = [],
    onChange,
    maxImages = 3,
    bucket = 'produtos',
    folder = 'images',
    maxSizeMB = 0.5,
    maxWidthOrHeight = 800,
    className,
}: MultiImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const compressAndUpload = useCallback(
        async (file: File) => {
            if (value.length >= maxImages) {
                setError(`Máximo de ${maxImages} imagens permitidas`)
                return
            }

            setUploading(true)
            setError(null)

            try {
                if (!file.type.startsWith('image/')) {
                    throw new Error('Arquivo deve ser uma imagem')
                }

                const options = {
                    maxSizeMB,
                    maxWidthOrHeight,
                    useWebWorker: true,
                    fileType: 'image/webp' as const,
                }

                const compressedFile = await imageCompression(file, options)

                const timestamp = Date.now()
                const randomId = Math.random().toString(36).substring(2, 8)
                const fileName = `${folder}/${timestamp}-${randomId}.webp`

                const { data, error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(fileName, compressedFile, {
                        cacheControl: '3600',
                        upsert: false,
                    })

                if (uploadError) {
                    throw uploadError
                }

                const {
                    data: { publicUrl },
                } = supabase.storage.from(bucket).getPublicUrl(data.path)

                onChange([...value, publicUrl])
            } catch (err) {
                console.error('Erro no upload:', err)
                setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
            } finally {
                setUploading(false)
            }
        },
        [bucket, folder, maxSizeMB, maxWidthOrHeight, onChange, value, maxImages]
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
            // Reset input para permitir selecionar o mesmo arquivo novamente
            if (inputRef.current) {
                inputRef.current.value = ''
            }
        },
        [compressAndUpload]
    )

    const handleRemove = useCallback((index: number) => {
        const newValue = value.filter((_, i) => i !== index)
        onChange(newValue)
        setError(null)
    }, [onChange, value])

    const moveImage = useCallback((fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= value.length) return
        const newValue = [...value]
        const [moved] = newValue.splice(fromIndex, 1)
        newValue.splice(toIndex, 0, moved)
        onChange(newValue)
    }, [onChange, value])

    return (
        <div className={cn('space-y-3', className)}>
            {/* Grid de imagens */}
            <div className="flex flex-wrap gap-3">
                {/* Imagens existentes */}
                {value.map((url, index) => (
                    <div key={url} className="relative group">
                        <div className="relative w-[120px] h-[120px] rounded-lg overflow-hidden border bg-muted">
                            <img
                                src={url}
                                alt={`Imagem ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {/* Badge de posição */}
                            <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                {index + 1}º
                            </div>
                            {/* Overlay com ações */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleRemove(index)}
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Remover
                                </Button>
                                {value.length > 1 && (
                                    <div className="flex gap-1">
                                        {index > 0 && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="h-6 text-xs px-2"
                                                onClick={() => moveImage(index, index - 1)}
                                            >
                                                ←
                                            </Button>
                                        )}
                                        {index < value.length - 1 && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="h-6 text-xs px-2"
                                                onClick={() => moveImage(index, index + 1)}
                                            >
                                                →
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Área de adicionar nova imagem */}
                {value.length < maxImages && (
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        className={cn(
                            'flex flex-col items-center justify-center w-[120px] h-[120px]',
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
                            <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="text-[10px]">Enviando...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1 text-muted-foreground p-2 text-center">
                                {dragActive ? (
                                    <>
                                        <Upload className="h-6 w-6 text-primary" />
                                        <span className="text-[10px]">Solte!</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-6 w-6" />
                                        <span className="text-[10px]">
                                            Adicionar foto
                                        </span>
                                        <span className="text-[9px] text-muted-foreground/60">
                                            {value.length}/{maxImages}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground">
                {value.length === 0
                    ? `Adicione até ${maxImages} fotos do produto. A primeira será a foto principal.`
                    : `${value.length} de ${maxImages} fotos. Arraste para reordenar.`
                }
            </p>

            {/* Erro */}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    )
}
