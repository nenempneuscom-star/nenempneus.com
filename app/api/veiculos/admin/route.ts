import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const VEICULOS_FILE_PATH = path.join(process.cwd(), 'lib', 'data', 'veiculos-brasil.ts')

// Ler o arquivo e extrair os dados
async function lerVeiculos() {
    const content = await fs.readFile(VEICULOS_FILE_PATH, 'utf-8')

    // Extrair o array VEICULOS_BRASIL do arquivo
    const match = content.match(/export const VEICULOS_BRASIL[^=]*=\s*(\[[\s\S]*?\n\])/m)
    if (!match) {
        throw new Error('Não foi possível encontrar VEICULOS_BRASIL no arquivo')
    }

    // Converter para JSON (remover comentários e avaliar)
    const arrayStr = match[1]
        .replace(/\/\/.*$/gm, '') // Remove comentários de linha
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comentários de bloco

    // Usar eval com cuidado - apenas para este caso específico
    const veiculos = eval(arrayStr)
    return veiculos
}

// Gerar o conteúdo do arquivo TypeScript
function gerarArquivoTS(veiculos: any[]) {
    const veiculosStr = JSON.stringify(veiculos, null, 4)
        .replace(/"([^"]+)":/g, '$1:') // Remove aspas das chaves
        .replace(/"/g, "'") // Troca aspas duplas por simples

    return `// Base de dados de veículos brasileiros com medidas de pneus compatíveis
// Atualizado automaticamente via admin

export interface VeiculoModelo {
    nome: string
    anosDisponiveis: number[]
    medidasPneu: string[] // Formato: "largura/perfil/aro" ex: "175/70/14"
}

export interface VeiculoMarca {
    nome: string
    modelos: VeiculoModelo[]
}

export const VEICULOS_BRASIL: VeiculoMarca[] = ${veiculosStr}

// Funções auxiliares para busca

export function getMarcas(): string[] {
    return VEICULOS_BRASIL.map(m => m.nome).sort()
}

export function getModelosByMarca(marca: string): string[] {
    const marcaData = VEICULOS_BRASIL.find(m => m.nome.toLowerCase() === marca.toLowerCase())
    if (!marcaData) return []
    return marcaData.modelos.map(m => m.nome).sort()
}

export function getAnosByMarcaModelo(marca: string, modelo: string): number[] {
    const marcaData = VEICULOS_BRASIL.find(m => m.nome.toLowerCase() === marca.toLowerCase())
    if (!marcaData) return []

    const modeloData = marcaData.modelos.find(m => m.nome.toLowerCase() === modelo.toLowerCase())
    if (!modeloData) return []

    return modeloData.anosDisponiveis.sort((a, b) => b - a) // Ordem decrescente
}

export function getMedidasPneu(marca: string, modelo: string, ano?: number): string[] {
    const marcaData = VEICULOS_BRASIL.find(m => m.nome.toLowerCase() === marca.toLowerCase())
    if (!marcaData) return []

    const modeloData = marcaData.modelos.find(m => m.nome.toLowerCase() === modelo.toLowerCase())
    if (!modeloData) return []

    // Se ano foi especificado, verificar se está disponível
    if (ano && !modeloData.anosDisponiveis.includes(ano)) {
        return []
    }

    return modeloData.medidasPneu
}

export function buscarVeiculos(termo: string): Array<{marca: string, modelo: string, anos: number[], medidas: string[]}> {
    const termoLower = termo.toLowerCase()
    const resultados: Array<{marca: string, modelo: string, anos: number[], medidas: string[]}> = []

    VEICULOS_BRASIL.forEach(marca => {
        marca.modelos.forEach(modelo => {
            if (
                marca.nome.toLowerCase().includes(termoLower) ||
                modelo.nome.toLowerCase().includes(termoLower)
            ) {
                resultados.push({
                    marca: marca.nome,
                    modelo: modelo.nome,
                    anos: modelo.anosDisponiveis,
                    medidas: modelo.medidasPneu
                })
            }
        })
    })

    return resultados.slice(0, 20) // Limitar resultados
}
`
}

// GET - Retorna todos os veículos
export async function GET() {
    try {
        const veiculos = await lerVeiculos()
        return NextResponse.json({ success: true, veiculos })
    } catch (error: any) {
        console.error('Erro ao ler veículos:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// POST - Adiciona nova marca ou modelo
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { action, marca, modelo, anos, medidas } = body

        const veiculos = await lerVeiculos()

        switch (action) {
            case 'addMarca': {
                // Verificar se marca já existe
                const marcaExiste = veiculos.find((m: any) =>
                    m.nome.toLowerCase() === marca.toLowerCase()
                )
                if (marcaExiste) {
                    return NextResponse.json(
                        { success: false, error: 'Marca já existe' },
                        { status: 400 }
                    )
                }

                veiculos.push({
                    nome: marca,
                    modelos: []
                })
                veiculos.sort((a: any, b: any) => a.nome.localeCompare(b.nome))
                break
            }

            case 'addModelo': {
                const marcaData = veiculos.find((m: any) =>
                    m.nome.toLowerCase() === marca.toLowerCase()
                )
                if (!marcaData) {
                    return NextResponse.json(
                        { success: false, error: 'Marca não encontrada' },
                        { status: 404 }
                    )
                }

                // Verificar se modelo já existe
                const modeloExiste = marcaData.modelos.find((m: any) =>
                    m.nome.toLowerCase() === modelo.toLowerCase()
                )
                if (modeloExiste) {
                    return NextResponse.json(
                        { success: false, error: 'Modelo já existe nesta marca' },
                        { status: 400 }
                    )
                }

                marcaData.modelos.push({
                    nome: modelo,
                    anosDisponiveis: anos || [],
                    medidasPneu: medidas || []
                })
                marcaData.modelos.sort((a: any, b: any) => a.nome.localeCompare(b.nome))
                break
            }

            case 'updateModelo': {
                const marcaData = veiculos.find((m: any) =>
                    m.nome.toLowerCase() === marca.toLowerCase()
                )
                if (!marcaData) {
                    return NextResponse.json(
                        { success: false, error: 'Marca não encontrada' },
                        { status: 404 }
                    )
                }

                const modeloData = marcaData.modelos.find((m: any) =>
                    m.nome.toLowerCase() === modelo.toLowerCase()
                )
                if (!modeloData) {
                    return NextResponse.json(
                        { success: false, error: 'Modelo não encontrado' },
                        { status: 404 }
                    )
                }

                if (anos) modeloData.anosDisponiveis = anos
                if (medidas) modeloData.medidasPneu = medidas
                break
            }

            default:
                return NextResponse.json(
                    { success: false, error: 'Ação inválida' },
                    { status: 400 }
                )
        }

        // Salvar arquivo
        const novoConteudo = gerarArquivoTS(veiculos)
        await fs.writeFile(VEICULOS_FILE_PATH, novoConteudo, 'utf-8')

        return NextResponse.json({ success: true, veiculos })
    } catch (error: any) {
        console.error('Erro ao salvar veículos:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// DELETE - Remove marca ou modelo
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const marca = searchParams.get('marca')
        const modelo = searchParams.get('modelo')

        if (!marca) {
            return NextResponse.json(
                { success: false, error: 'Marca é obrigatória' },
                { status: 400 }
            )
        }

        const veiculos = await lerVeiculos()

        if (modelo) {
            // Deletar modelo específico
            const marcaData = veiculos.find((m: any) =>
                m.nome.toLowerCase() === marca.toLowerCase()
            )
            if (!marcaData) {
                return NextResponse.json(
                    { success: false, error: 'Marca não encontrada' },
                    { status: 404 }
                )
            }

            const modeloIndex = marcaData.modelos.findIndex((m: any) =>
                m.nome.toLowerCase() === modelo.toLowerCase()
            )
            if (modeloIndex === -1) {
                return NextResponse.json(
                    { success: false, error: 'Modelo não encontrado' },
                    { status: 404 }
                )
            }

            marcaData.modelos.splice(modeloIndex, 1)
        } else {
            // Deletar marca inteira
            const marcaIndex = veiculos.findIndex((m: any) =>
                m.nome.toLowerCase() === marca.toLowerCase()
            )
            if (marcaIndex === -1) {
                return NextResponse.json(
                    { success: false, error: 'Marca não encontrada' },
                    { status: 404 }
                )
            }

            veiculos.splice(marcaIndex, 1)
        }

        // Salvar arquivo
        const novoConteudo = gerarArquivoTS(veiculos)
        await fs.writeFile(VEICULOS_FILE_PATH, novoConteudo, 'utf-8')

        return NextResponse.json({ success: true, veiculos })
    } catch (error: any) {
        console.error('Erro ao deletar:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
