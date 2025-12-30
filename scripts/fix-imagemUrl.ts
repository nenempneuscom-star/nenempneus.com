import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixImagemUrl() {
    console.log('\n=== CORRIGINDO imagemUrl (.webp → .jpg) ===\n')

    // Buscar todos os produtos com imagemUrl contendo .webp
    const produtos = await prisma.produto.findMany({
        where: {
            imagemUrl: {
                contains: '.webp'
            }
        },
        select: {
            id: true,
            nome: true,
            imagemUrl: true,
        },
    })

    console.log(`📦 Produtos com imagemUrl .webp: ${produtos.length}\n`)

    let corrigidos = 0
    let erros = 0

    for (const produto of produtos) {
        if (!produto.imagemUrl) continue

        const novaUrl = produto.imagemUrl.replace('.webp', '.jpg')

        try {
            await prisma.produto.update({
                where: { id: produto.id },
                data: {
                    imagemUrl: novaUrl,
                },
            })

            console.log(`✅ ${produto.nome}`)
            console.log(`   Antes: ${produto.imagemUrl}`)
            console.log(`   Depois: ${novaUrl}\n`)
            corrigidos++
        } catch (error) {
            console.log(`❌ Erro em ${produto.nome}: ${error}\n`)
            erros++
        }
    }

    console.log('=== RESUMO ===')
    console.log(`Corrigidos: ${corrigidos}`)
    console.log(`Erros: ${erros}`)

    await prisma.$disconnect()
}

fixImagemUrl().catch(console.error)
