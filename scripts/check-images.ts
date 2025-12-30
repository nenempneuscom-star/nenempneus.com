import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkImages() {
    const produtos = await prisma.produto.findMany({
        where: {
            ativo: true,
        },
        select: {
            id: true,
            nome: true,
            imagemUrl: true,
            imagens: true,
        },
        take: 10,
    })

    console.log('\n=== VERIFICAÇÃO DE IMAGENS ===\n')

    for (const produto of produtos) {
        const imagens = produto.imagens as string[]
        console.log(`📦 ${produto.nome}`)
        console.log(`   ID: ${produto.id}`)
        console.log(`   imagemUrl: ${produto.imagemUrl || '(vazio)'}`)
        console.log(`   imagens: ${JSON.stringify(imagens)}`)

        if (imagens && imagens.length > 0) {
            console.log(`   Primeira imagem: ${imagens[0]}`)
            // Verificar se a URL parece válida
            if (!imagens[0] || imagens[0] === '' || imagens[0] === 'undefined' || imagens[0] === 'null') {
                console.log(`   ⚠️ PROBLEMA: Primeira imagem inválida!`)
            }
        }
        console.log('')
    }

    await prisma.$disconnect()
}

checkImages().catch(console.error)
