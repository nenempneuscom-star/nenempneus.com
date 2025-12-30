import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
    const produtos = await prisma.produto.findMany({
        where: {
            OR: [
                { nome: { contains: 'Michelin Primacy 4' } },
                { nome: { contains: 'Bridgestone DUELER 205' } },
                { nome: { contains: 'CONTINENTAL ECO 165' } }
            ]
        },
        select: {
            nome: true,
            imagemUrl: true,
            imagens: true
        }
    })

    for (const p of produtos) {
        console.log('\n📦', p.nome)
        console.log('   imagemUrl:', p.imagemUrl || '(vazio)')
        const imagens = p.imagens as string[]
        console.log('   imagens[0]:', imagens?.[0] || '(vazio)')
    }

    await prisma.$disconnect()
}

check()
