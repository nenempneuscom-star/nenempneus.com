/**
 * Script para converter todas as imagens WebP para JPEG
 *
 * Este script:
 * 1. Busca todas as URLs de imagens WebP no banco de dados
 * 2. Baixa cada imagem
 * 3. Converte de WebP para JPEG usando Sharp
 * 4. Faz upload do JPEG para o Supabase
 * 5. Atualiza as URLs no banco de dados
 * 6. Remove os arquivos WebP antigos
 *
 * Executar com: npx tsx scripts/convert-webp-to-jpeg.ts
 */

import { config } from 'dotenv'
config() // Carrega variáveis do .env

import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'

const db = new PrismaClient()

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔑 Usando chave:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon')
console.log('🔑 Key length:', supabaseServiceKey?.length)

const BUCKET = 'produtos'
const JPEG_QUALITY = 85

interface ConversionResult {
    oldUrl: string
    newUrl: string
    success: boolean
    error?: string
}

async function convertWebpToJpeg(webpUrl: string): Promise<ConversionResult> {
    try {
        // Extrair o path do arquivo da URL
        // URL: https://xxx.supabase.co/storage/v1/object/public/produtos/images/xxx.webp
        const urlParts = webpUrl.split('/storage/v1/object/public/')
        if (urlParts.length !== 2) {
            throw new Error('URL inválida')
        }

        const fullPath = urlParts[1] // produtos/images/xxx.webp
        const pathParts = fullPath.split('/')
        const bucket = pathParts[0] // produtos
        const filePath = pathParts.slice(1).join('/') // images/xxx.webp

        // Baixar a imagem WebP diretamente da URL pública
        console.log(`   📥 Baixando: ${filePath}`)
        const response = await fetch(webpUrl)
        if (!response.ok) {
            throw new Error(`Erro ao baixar: ${response.status}`)
        }
        const webpBuffer = Buffer.from(await response.arrayBuffer())

        // Converter WebP para JPEG usando Sharp
        console.log(`   🔄 Convertendo para JPEG...`)
        const jpegBuffer = await sharp(webpBuffer)
            .jpeg({ quality: JPEG_QUALITY })
            .toBuffer()

        // Gerar novo nome de arquivo
        const newFileName = filePath.replace('.webp', '.jpg')

        // Upload do JPEG via REST API
        console.log(`   📤 Enviando: ${newFileName}`)
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${newFileName}`
        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'image/jpeg',
                'x-upsert': 'true',
            },
            body: new Uint8Array(jpegBuffer),
        })

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            throw new Error(`Erro ao fazer upload: ${uploadResponse.status} - ${errorText}`)
        }

        // Obter URL pública do novo arquivo
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${newFileName}`

        // Deletar arquivo WebP antigo via REST API
        console.log(`   🗑️ Removendo WebP antigo...`)
        const deleteUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`
        await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
            },
        })

        return {
            oldUrl: webpUrl,
            newUrl: publicUrl,
            success: true
        }
    } catch (error) {
        return {
            oldUrl: webpUrl,
            newUrl: '',
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
    }
}

async function main() {
    console.log('\n🚀 Iniciando conversão de imagens WebP → JPEG\n')
    console.log('=' .repeat(60))

    // Buscar todos os produtos
    const produtos = await db.produto.findMany({
        select: {
            id: true,
            nome: true,
            imagemUrl: true,
            imagens: true,
        }
    })

    console.log(`\n📊 Total de produtos: ${produtos.length}`)

    // Mapear todas as URLs WebP únicas e suas referências
    const urlMap = new Map<string, { produtoIds: string[], field: 'imagemUrl' | 'imagens', index?: number }[]>()

    for (const produto of produtos) {
        // imagemUrl principal
        if (produto.imagemUrl && produto.imagemUrl.includes('.webp')) {
            const refs = urlMap.get(produto.imagemUrl) || []
            refs.push({ produtoIds: [produto.id], field: 'imagemUrl' })
            urlMap.set(produto.imagemUrl, refs)
        }

        // Array de imagens
        const imagens = produto.imagens as string[] || []
        imagens.forEach((url, index) => {
            if (url && url.includes('.webp')) {
                const refs = urlMap.get(url) || []
                refs.push({ produtoIds: [produto.id], field: 'imagens', index })
                urlMap.set(url, refs)
            }
        })
    }

    const webpUrls = Array.from(urlMap.keys())
    console.log(`📸 Imagens WebP para converter: ${webpUrls.length}`)
    console.log('\n' + '='.repeat(60) + '\n')

    if (webpUrls.length === 0) {
        console.log('✅ Nenhuma imagem WebP encontrada. Nada a fazer!')
        await db.$disconnect()
        return
    }

    // Converter cada imagem
    const results: ConversionResult[] = []
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < webpUrls.length; i++) {
        const url = webpUrls[i]
        console.log(`\n[${i + 1}/${webpUrls.length}] Processando...`)
        console.log(`   URL: ${url.substring(0, 80)}...`)

        const result = await convertWebpToJpeg(url)
        results.push(result)

        if (result.success) {
            successCount++
            console.log(`   ✅ Sucesso!`)

            // Atualizar banco de dados
            for (const produto of produtos) {
                let needsUpdate = false
                const updateData: { imagemUrl?: string, imagens?: string[] } = {}

                // Atualizar imagemUrl
                if (produto.imagemUrl === url) {
                    updateData.imagemUrl = result.newUrl
                    needsUpdate = true
                }

                // Atualizar array de imagens
                const imagens = produto.imagens as string[] || []
                const newImagens = imagens.map(img => img === url ? result.newUrl : img)
                if (JSON.stringify(imagens) !== JSON.stringify(newImagens)) {
                    updateData.imagens = newImagens
                    needsUpdate = true
                }

                if (needsUpdate) {
                    await db.produto.update({
                        where: { id: produto.id },
                        data: updateData
                    })
                    console.log(`   📝 Atualizado produto: ${produto.nome.substring(0, 40)}...`)
                }
            }
        } else {
            errorCount++
            console.log(`   ❌ Erro: ${result.error}`)
        }

        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Resumo final
    console.log('\n' + '='.repeat(60))
    console.log('\n📊 RESUMO DA CONVERSÃO\n')
    console.log(`   ✅ Sucesso: ${successCount}`)
    console.log(`   ❌ Erros: ${errorCount}`)
    console.log(`   📸 Total: ${webpUrls.length}`)

    if (errorCount > 0) {
        console.log('\n⚠️ Imagens com erro:')
        results
            .filter(r => !r.success)
            .forEach(r => console.log(`   - ${r.oldUrl.substring(0, 60)}... : ${r.error}`))
    }

    console.log('\n✨ Conversão finalizada!\n')

    await db.$disconnect()
}

main().catch(console.error)
