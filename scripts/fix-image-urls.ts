import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixImageUrls() {
    console.log('\n=== CORRIGINDO URLs DE IMAGENS ===\n')

    // Buscar todos os produtos com imagens
    const produtos = await prisma.produto.findMany({
        select: {
            id: true,
            nome: true,
            imagemUrl: true,
            imagens: true,
        },
    })

    let corrigidos = 0
    let erros = 0

    for (const produto of produtos) {
        const imagens = produto.imagens as string[]

        if (!imagens || imagens.length === 0) continue

        // Verificar se há URLs com .webp
        const temWebp = imagens.some(url => url?.includes('.webp'))

        if (temWebp) {
            // Converter .webp para .jpg
            const imagensCorrigidas = imagens.map(url => {
                if (url?.includes('.webp')) {
                    return url.replace('.webp', '.jpg')
                }
                return url
            })

            try {
                await prisma.produto.update({
                    where: { id: produto.id },
                    data: {
                        imagens: imagensCorrigidas,
                    },
                })

                console.log(`✅ ${produto.nome}`)
                console.log(`   Antes: ${imagens[0]}`)
                console.log(`   Depois: ${imagensCorrigidas[0]}`)
                corrigidos++
            } catch (error) {
                console.log(`❌ Erro em ${produto.nome}: ${error}`)
                erros++
            }
        }
    }

    console.log('\n=== RESUMO ===')
    console.log(`Corrigidos: ${corrigidos}`)
    console.log(`Erros: ${erros}`)
    console.log(`Total processados: ${produtos.length}`)

    await prisma.$disconnect()
}

fixImageUrls().catch(console.error)
