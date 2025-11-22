import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Carregar .env.local manualmente
const envLocalPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
    console.log('🔑 Chaves encontradas:', Object.keys(envConfig))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
    console.log('✅ .env.local carregado')
} else {
    console.error('❌ .env.local não encontrado')
}

const prisma = new PrismaClient()

async function main() {
    console.log('🔌 Testando conexão com o banco...')
    console.log(`   URL: ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@')}`) // Esconde a senha no log

    try {
        await prisma.$connect()
        console.log('✅ Conexão bem-sucedida!')

        const loja = await prisma.loja.findUnique({
            where: { slug: 'nenem-pneus' }
        })

        if (loja) {
            console.log(`✅ Loja encontrada: ${loja.nome}`)
        } else {
            console.log('⚠️ Conexão OK, mas loja "nenem-pneus" não encontrada.')
        }

    } catch (e: any) {
        console.error('❌ Falha na conexão:')
        console.error(e.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
