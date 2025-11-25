import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET() {
  try {
    // Criar workbook e worksheet
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Produtos')

    // Definir colunas com largura e estilo
    worksheet.columns = [
      { header: 'Nome', key: 'nome', width: 40 },
      { header: 'Marca', key: 'marca', width: 20 },
      { header: 'Preço', key: 'preco', width: 15 },
      { header: 'Quantidade', key: 'quantidade', width: 15 },
      { header: 'Medida', key: 'medida', width: 20 },
      { header: 'Categoria', key: 'categoria', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Descrição (opcional)', key: 'descricao', width: 50 },
    ]

    // Estilizar cabeçalho
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 25

    // Adicionar borda ao cabeçalho
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Adicionar linha de exemplo
    const exampleRow = worksheet.addRow({
      nome: 'Pneu Pirelli Scorpion ATR 265/70R16',
      marca: 'Pirelli',
      preco: 899.90,
      quantidade: 10,
      medida: '265/70R16',
      categoria: 'pneus',
      status: 'ativo',
      descricao: 'Pneu para SUV com excelente desempenho off-road'
    })

    // Estilizar linha de exemplo
    exampleRow.font = { italic: true, color: { argb: 'FF666666' } }
    exampleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' }
    }

    // Adicionar validação de dados para categoria
    // Nota: As categorias devem corresponder aos slugs das categorias no banco de dados
    worksheet.dataValidations.add('F3:F502', {
      type: 'list',
      allowBlank: false,
      formulae: ['"pneus,servicos,acessorios,baterias,oleos"'],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Categoria inválida',
      error: 'Use o slug exato da categoria (ex: pneus, servicos, acessorios, etc.)'
    })

    // Adicionar validação de dados para status
    worksheet.dataValidations.add('G3:G502', {
      type: 'list',
      allowBlank: false,
      formulae: ['"ativo,inativo"'],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Status inválido',
      error: 'Selecione: ativo ou inativo'
    })

    // Adicionar instruções em uma nova planilha
    const instructionsSheet = workbook.addWorksheet('Instruções')
    instructionsSheet.columns = [
      { header: 'Campo', key: 'campo', width: 25 },
      { header: 'Obrigatório', key: 'obrigatorio', width: 15 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Exemplo', key: 'exemplo', width: 40 },
      { header: 'Observações', key: 'observacoes', width: 50 },
    ]

    // Estilizar cabeçalho das instruções
    const instrHeaderRow = instructionsSheet.getRow(1)
    instrHeaderRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    instrHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    }
    instrHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
    instrHeaderRow.height = 25

    // Adicionar instruções detalhadas
    const instructions = [
      {
        campo: 'Nome',
        obrigatorio: 'SIM',
        tipo: 'Texto',
        exemplo: 'Pneu Pirelli Scorpion ATR 265/70R16',
        observacoes: 'Mínimo 3 caracteres, máximo 200'
      },
      {
        campo: 'Marca',
        obrigatorio: 'SIM',
        tipo: 'Texto',
        exemplo: 'Pirelli',
        observacoes: 'Mínimo 2 caracteres, máximo 100'
      },
      {
        campo: 'Preço',
        obrigatorio: 'SIM',
        tipo: 'Número',
        exemplo: '899.90',
        observacoes: 'Valor positivo. Use ponto ou vírgula para decimal'
      },
      {
        campo: 'Quantidade',
        obrigatorio: 'SIM',
        tipo: 'Número',
        exemplo: '10',
        observacoes: 'Número inteiro não negativo'
      },
      {
        campo: 'Medida',
        obrigatorio: 'SIM',
        tipo: 'Texto',
        exemplo: '265/70R16',
        observacoes: 'Especificação do produto (ex: dimensão do pneu)'
      },
      {
        campo: 'Categoria',
        obrigatorio: 'SIM',
        tipo: 'Lista',
        exemplo: 'pneus',
        observacoes: 'Use o slug da categoria cadastrada no sistema (ex: pneus, servicos, acessorios)'
      },
      {
        campo: 'Status',
        obrigatorio: 'NÃO',
        tipo: 'Lista',
        exemplo: 'ativo',
        observacoes: 'Padrão: ativo. Opções: ativo, inativo'
      },
      {
        campo: 'Descrição',
        obrigatorio: 'NÃO',
        tipo: 'Texto',
        exemplo: 'Pneu para SUV com excelente desempenho',
        observacoes: 'Máximo 1000 caracteres'
      },
    ]

    instructions.forEach(instr => {
      const row = instructionsSheet.addRow(instr)
      row.alignment = { vertical: 'middle', wrapText: true }
    })

    // Adicionar observações gerais
    instructionsSheet.addRow([])
    instructionsSheet.addRow(['OBSERVAÇÕES GERAIS:'])
    instructionsSheet.getRow(instructionsSheet.rowCount).font = { bold: true, size: 14 }

    instructionsSheet.addRow(['• Máximo de 500 produtos por importação'])
    instructionsSheet.addRow(['• Tamanho máximo do arquivo: 5MB'])
    instructionsSheet.addRow(['• Não altere os nomes das colunas do cabeçalho'])
    instructionsSheet.addRow(['• A linha de exemplo pode ser removida ou alterada'])
    instructionsSheet.addRow(['• Preencha os dados a partir da linha 3 na planilha "Produtos"'])
    instructionsSheet.addRow(['• Após preencher, salve e faça o upload do arquivo'])

    // Gerar buffer do arquivo Excel
    const buffer = await workbook.xlsx.writeBuffer()

    // Retornar arquivo
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="modelo_importacao_produtos_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
  } catch (error) {
    console.error('[ERRO] Falha ao gerar template:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar arquivo template' },
      { status: 500 }
    )
  }
}
