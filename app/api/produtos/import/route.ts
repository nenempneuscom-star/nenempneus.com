import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  validateFile,
  validateAllProducts,
  fileValidation,
  type ProdutoImportData
} from '@/lib/import-validation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/produtos/import
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar permissão
    const usuario: any = await db.usuario.findUnique({
      where: { id: session.userId },
      select: { permissoes: true }
    })

    const permissoes = typeof usuario.permissoes === 'string'
      ? JSON.parse(usuario.permissoes)
      : usuario.permissoes

    if (!permissoes.produtos) {
      return NextResponse.json(
        { error: 'Sem permissão para importar produtos' },
        { status: 403 }
      )
    }

    // Verificar se feature flag está habilitada
    const loja = await db.loja.findFirst()
    if (!loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    const settings = await db.settings.findUnique({
      where: { lojaId: loja.id },
      select: { featureFlags: true }
    })

    if (settings) {
      const featureFlags = typeof settings.featureFlags === 'string'
        ? JSON.parse(settings.featureFlags)
        : settings.featureFlags

      if (featureFlags && featureFlags.importacaoEmMassa === false) {
        console.log('[IMPORT] Recurso desabilitado por feature flag')
        return NextResponse.json(
          {
            error: 'Recurso desabilitado',
            message: 'A importação em massa está temporariamente desabilitada. Contate o administrador.'
          },
          { status: 403 }
        )
      }
    }

    // Obter dados do formulário
    const formData = await request.formData()
    const file = formData.get('file') as File
    const dryRun = formData.get('dryRun') === 'true' // Preview mode

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // ===== CAMADA 1: Validação de Arquivo (Frontend + Backend) =====
    const fileValidationResult = validateFile(file)
    if (!fileValidationResult.valid) {
      return NextResponse.json(
        { error: fileValidationResult.error },
        { status: 400 }
      )
    }

    // Ler arquivo Excel
    const arrayBuffer = await file.arrayBuffer()

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(Buffer.from(arrayBuffer) as any)

    const worksheet = workbook.getWorksheet('Produtos')
    if (!worksheet) {
      return NextResponse.json(
        { error: 'Planilha "Produtos" não encontrada. Use o modelo fornecido.' },
        { status: 400 }
      )
    }

    // Extrair dados (pulando cabeçalho na linha 1 e exemplo na linha 2)
    const rows: any[] = []
    worksheet.eachRow((row, rowNumber) => {
      // Pular cabeçalho (linha 1) e linha de exemplo (linha 2)
      if (rowNumber <= 2) return

      const rowData = {
        nome: row.getCell(1).value?.toString() || '',
        marca: row.getCell(2).value?.toString() || '',
        preco: row.getCell(3).value,
        quantidade: row.getCell(4).value,
        medida: row.getCell(5).value?.toString() || '',
        categoria: row.getCell(6).value?.toString().toLowerCase() || '',
        status: row.getCell(7).value?.toString().toLowerCase() || 'ativo',
        descricao: row.getCell(8).value?.toString() || undefined,
      }

      // Ignorar linhas completamente vazias
      const isEmpty = !rowData.nome && !rowData.marca && !rowData.preco
      if (!isEmpty) {
        rows.push(rowData)
      }
    })

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum produto encontrado no arquivo' },
        { status: 400 }
      )
    }

    // Verificar limite de linhas
    if (rows.length > fileValidation.maxRows) {
      return NextResponse.json(
        { error: `Número máximo de produtos excedido. Máximo: ${fileValidation.maxRows}` },
        { status: 400 }
      )
    }

    // ===== CAMADA 2 & 3: Sanitização + Validação Zod =====
    const validationResult = await validateAllProducts(rows)

    // Se há erros de validação, retornar preview com erros
    if (validationResult.invalid.length > 0) {
      return NextResponse.json({
        success: false,
        preview: true,
        summary: validationResult.summary,
        validProducts: validationResult.valid,
        invalidProducts: validationResult.invalid,
        errors: validationResult.invalid.flatMap(item => item.errors)
      }, { status: 200 })
    }

    // ===== CAMADA 4: Preview / Dry-Run =====
    if (dryRun) {
      return NextResponse.json({
        success: true,
        preview: true,
        summary: validationResult.summary,
        products: validationResult.valid,
        message: `${validationResult.valid.length} produtos prontos para importar`
      }, { status: 200 })
    }

    // ===== CAMADA 5: Transação no Banco de Dados =====
    let importedCount = 0

    try {
      // Buscar loja do usuário
      const loja = await db.loja.findFirst()
      if (!loja) {
        return NextResponse.json(
          { error: 'Loja não encontrada. Configure a loja primeiro.' },
          { status: 400 }
        )
      }

      // Buscar todas as categorias para mapear
      const categorias = await db.categoria.findMany({
        where: { lojaId: loja.id }
      })

      // Criar mapa de categorias por nome (case-insensitive)
      const categoriasMap = new Map(
        categorias.map(cat => [cat.slug.toLowerCase(), cat.id])
      )

      // Usar transação para garantir atomicidade
      const result = await db.$transaction(async (tx) => {
        const created = []

        for (const produto of validationResult.valid) {
          try {
            // Encontrar categoria ID
            const categoriaId = categoriasMap.get(produto.categoria.toLowerCase())
            if (!categoriaId) {
              throw new Error(`Categoria "${produto.categoria}" não encontrada`)
            }

            // Gerar slug único
            const baseSlug = produto.nome
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim()

            let slug = baseSlug
            let counter = 1

            // Verificar se slug já existe
            while (await tx.produto.findFirst({
              where: { lojaId: loja.id, slug }
            })) {
              slug = `${baseSlug}-${counter}`
              counter++
            }

            // Criar specs JSON
            const specs: Record<string, string> = {
              marca: produto.marca,
              medida: produto.medida,
            }

            const novoProduto = await tx.produto.create({
              data: {
                lojaId: loja.id,
                categoriaId,
                nome: produto.nome,
                slug,
                preco: produto.preco,
                estoque: produto.quantidade,
                descricao: produto.descricao || null,
                ativo: produto.status === 'ativo',
                destaque: false,
                imagemUrl: '/placeholder-produto.jpg',
                specs,
                veiculos: []
              }
            })
            created.push(novoProduto)
          } catch (err: any) {
            throw new Error(`Erro ao criar produto "${produto.nome}": ${err.message}`)
          }
        }

        return created
      })

      importedCount = result.length

      return NextResponse.json({
        success: true,
        preview: false,
        summary: {
          total: rows.length,
          imported: importedCount,
          failed: 0
        },
        message: `${importedCount} produtos importados com sucesso!`
      }, { status: 200 })

    } catch (error: any) {
      console.error('[ERRO] Falha na transação de importação:', error)

      // Se falhou, a transação foi revertida automaticamente
      return NextResponse.json({
        success: false,
        error: 'Falha ao importar produtos. Nenhum produto foi salvo.',
        details: error.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('[ERRO] Erro ao processar importação:', error)
    return NextResponse.json(
      { error: 'Erro ao processar arquivo', details: error.message },
      { status: 500 }
    )
  }
}
