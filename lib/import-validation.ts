import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Schema de validação para importação de produtos
export const produtoImportSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .transform(val => DOMPurify.sanitize(val.trim())),

  marca: z.string()
    .min(2, 'Marca deve ter pelo menos 2 caracteres')
    .max(100, 'Marca deve ter no máximo 100 caracteres')
    .transform(val => DOMPurify.sanitize(val.trim())),

  preco: z.union([
    z.number().positive('Preço deve ser maior que zero'),
    z.string()
      .transform(val => {
        // Remove espaços e substitui vírgula por ponto
        const cleaned = val.replace(/\s/g, '').replace(',', '.')
        const parsed = parseFloat(cleaned)
        if (isNaN(parsed)) {
          throw new Error('Preço inválido')
        }
        return parsed
      })
  ]).refine(val => val > 0, 'Preço deve ser maior que zero'),

  quantidade: z.union([
    z.number().int('Quantidade deve ser um número inteiro').min(0, 'Quantidade não pode ser negativa'),
    z.string()
      .transform(val => {
        const parsed = parseInt(val.replace(/\s/g, ''), 10)
        if (isNaN(parsed)) {
          throw new Error('Quantidade inválida')
        }
        return parsed
      })
  ]).refine(val => val >= 0, 'Quantidade não pode ser negativa'),

  medida: z.string()
    .min(3, 'Medida deve ter pelo menos 3 caracteres')
    .max(50, 'Medida deve ter no máximo 50 caracteres')
    .transform(val => DOMPurify.sanitize(val.trim())),

  categoria: z.string()
    .min(2, 'Categoria deve ter pelo menos 2 caracteres')
    .transform(val => DOMPurify.sanitize(val.trim().toLowerCase())),

  status: z.enum(['ativo', 'inativo'], {
    errorMap: () => ({ message: 'Status inválido. Use: ativo ou inativo' })
  }).default('ativo'),

  descricao: z.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional()
    .transform(val => val ? DOMPurify.sanitize(val.trim()) : undefined),
})

export type ProdutoImportData = z.infer<typeof produtoImportSchema>

// Validação de arquivo
export const fileValidation = {
  maxSize: 5 * 1024 * 1024, // 5MB
  maxRows: 500,
  allowedExtensions: ['.xlsx', '.xls'],
  allowedMimeTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
}

// Função para validar arquivo antes de processar
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Validar extensão
  const fileName = file.name.toLowerCase()
  const hasValidExtension = fileValidation.allowedExtensions.some(ext => fileName.endsWith(ext))

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Arquivo deve ter extensão ${fileValidation.allowedExtensions.join(' ou ')}`
    }
  }

  // Validar tipo MIME
  if (!fileValidation.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo inválido. Use apenas arquivos Excel (.xlsx ou .xls)'
    }
  }

  // Validar tamanho
  if (file.size > fileValidation.maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${fileValidation.maxSize / 1024 / 1024}MB`
    }
  }

  return { valid: true }
}

// Função para sanitizar e validar linha do Excel
export async function validateProductRow(
  row: any,
  rowIndex: number
): Promise<{ success: boolean; data?: ProdutoImportData; errors?: string[] }> {
  try {
    // Validar com Zod
    const validated = produtoImportSchema.parse(row)

    return {
      success: true,
      data: validated
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      return {
        success: false,
        errors: [`Linha ${rowIndex + 1}: ${errors.join(', ')}`]
      }
    }

    return {
      success: false,
      errors: [`Linha ${rowIndex + 1}: Erro desconhecido ao validar`]
    }
  }
}

// Função para validar todos os produtos
export async function validateAllProducts(
  products: any[]
): Promise<{
  valid: ProdutoImportData[]
  invalid: { row: number; errors: string[] }[]
  summary: {
    total: number
    valid: number
    invalid: number
  }
}> {
  const valid: ProdutoImportData[] = []
  const invalid: { row: number; errors: string[] }[] = []

  // Validar limite de linhas
  if (products.length > fileValidation.maxRows) {
    throw new Error(`Número máximo de linhas excedido. Máximo: ${fileValidation.maxRows}`)
  }

  for (let i = 0; i < products.length; i++) {
    const result = await validateProductRow(products[i], i)

    if (result.success && result.data) {
      valid.push(result.data)
    } else if (result.errors) {
      invalid.push({
        row: i + 1,
        errors: result.errors
      })
    }
  }

  return {
    valid,
    invalid,
    summary: {
      total: products.length,
      valid: valid.length,
      invalid: invalid.length
    }
  }
}
