import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSettings() {
    console.log('\n=== VERIFICANDO SETTINGS ===\n')

    const loja = await prisma.loja.findFirst({
        include: { settings: true }
    })

    if (!loja) {
        console.log('❌ Loja não encontrada')
        return
    }

    console.log('✅ Loja encontrada:', loja.nome)

    if (!loja.settings) {
        console.log('❌ Settings não encontradas')
        return
    }

    console.log('\n📋 Configurações de Parcelamento:')
    console.log(`   parcelasMaximas: ${loja.settings.parcelasMaximas}`)
    console.log(`   taxaJuros: ${loja.settings.taxaJuros}`)
    console.log(`   descontoPix: ${loja.settings.descontoPix}`)

    await prisma.$disconnect()
}

checkSettings().catch(console.error)
