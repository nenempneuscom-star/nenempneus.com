import { config } from 'dotenv'
// Forçar carregar .env antes de qualquer coisa
config({ override: true })

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed...')

    // 1. CRIAR LOJA NENÉM PNEUS
    const loja = await prisma.loja.upsert({
        where: { slug: 'nenem-pneus' },
        update: {},
        create: {
            slug: 'nenem-pneus',
            nome: 'NenemPneus.com',
            email: 'contato@nenempneus.com',
            whatsapp: '5548999973889',
            telefone: '(48) 99997-3889',
            endereco: 'Av. Nereu Ramos, 740',
            cidade: 'Capivari de Baixo',
            estado: 'SC',
            cep: '88745-000',
            corPrimaria: '#FF6B00',
            corSecundaria: '#1A1A1A',
            ativo: true,
            plano: 'basico',
        },
    })
    console.log('✅ Loja criada:', loja.nome)

    // 2. CRIAR SETTINGS PADRÃO
    const settings = await prisma.settings.upsert({
        where: { lojaId: loja.id },
        update: {},
        create: {
            lojaId: loja.id,
        },
    })
    console.log('✅ Settings criadas')

    // 3. CRIAR CATEGORIA
    const categoria = await prisma.categoria.upsert({
        where: {
            lojaId_slug: {
                lojaId: loja.id,
                slug: 'pneus-seminovos',
            },
        },
        update: {},
        create: {
            lojaId: loja.id,
            nome: 'Pneus Seminovos',
            slug: 'pneus-seminovos',
            descricao: 'Pneus seminovos inspecionados de qualidade',
            ativo: true,
            ordem: 1,
        },
    })
    console.log('✅ Categoria criada:', categoria.nome)

    // 4. CRIAR PRODUTOS EXEMPLO
    const produtos = [
        {
            nome: 'Pirelli P4 175/70R14',
            slug: 'pirelli-p4-175-70-r14',
            descricao: 'Pneu seminovo em excelente estado. Sulco 7mm.',
            preco: 380,
            estoque: 8,
            specs: {
                marca: 'Pirelli',
                modelo: 'P4',
                aro: '14',
                largura: '175',
                perfil: '70',
                sulco: '7mm',
            },
            veiculos: [
                { marca: 'Volkswagen', modelo: 'Gol', anos: [2015, 2016, 2017, 2018] },
                { marca: 'Fiat', modelo: 'Palio', anos: [2014, 2015, 2016] },
            ],
            ativo: true,
            destaque: true,
        },
        {
            nome: 'Goodyear EfficientGrip 185/65R15',
            slug: 'goodyear-efficientgrip-185-65-r15',
            descricao: 'Pneu seminovo com ótima durabilidade. Sulco 6.5mm.',
            preco: 420,
            estoque: 6,
            specs: {
                marca: 'Goodyear',
                modelo: 'EfficientGrip',
                aro: '15',
                largura: '185',
                perfil: '65',
                sulco: '6.5mm',
            },
            veiculos: [
                { marca: 'Fiat', modelo: 'Uno', anos: [2018, 2019, 2020, 2021] },
                { marca: 'Chevrolet', modelo: 'Onix', anos: [2017, 2018, 2019] },
            ],
            ativo: true,
            destaque: true,
        },
        {
            nome: 'Michelin Primacy 195/55R16',
            slug: 'michelin-primacy-195-55-r16',
            descricao: 'Pneu premium seminovo. Sulco 8mm. Excelente performance.',
            preco: 520,
            estoque: 4,
            specs: {
                marca: 'Michelin',
                modelo: 'Primacy',
                aro: '16',
                largura: '195',
                perfil: '55',
                sulco: '8mm',
            },
            veiculos: [
                { marca: 'Toyota', modelo: 'Corolla', anos: [2015, 2016, 2017] },
                { marca: 'Honda', modelo: 'Civic', anos: [2014, 2015, 2016] },
            ],
            ativo: true,
            destaque: false,
        },
        {
            nome: 'Bridgestone Turanza 205/60R16',
            slug: 'bridgestone-turanza-205-60-r16',
            descricao: 'Pneu confortável para sedãs. Sulco 7mm.',
            preco: 480,
            estoque: 5,
            specs: {
                marca: 'Bridgestone',
                modelo: 'Turanza',
                aro: '16',
                largura: '205',
                perfil: '60',
                sulco: '7mm',
            },
            veiculos: [
                { marca: 'Ford', modelo: 'Focus', anos: [2016, 2017, 2018] },
                { marca: 'Hyundai', modelo: 'Elantra', anos: [2015, 2016, 2017] },
            ],
            ativo: true,
            destaque: true,
        },
        {
            nome: 'Continental ContiPowerContact 185/60R15',
            slug: 'continental-contipower-185-60-r15',
            descricao: 'Pneu econômico e durável. Sulco 6mm.',
            preco: 390,
            estoque: 10,
            specs: {
                marca: 'Continental',
                modelo: 'ContiPowerContact',
                aro: '15',
                largura: '185',
                perfil: '60',
                sulco: '6mm',
            },
            veiculos: [
                { marca: 'Volkswagen', modelo: 'Polo', anos: [2017, 2018, 2019] },
                { marca: 'Renault', modelo: 'Sandero', anos: [2016, 2017, 2018] },
            ],
            ativo: true,
            destaque: false,
        },
    ]

    for (const prod of produtos) {
        await prisma.produto.upsert({
            where: {
                lojaId_slug: {
                    lojaId: loja.id,
                    slug: prod.slug,
                },
            },
            update: {},
            create: {
                ...prod,
                lojaId: loja.id,
                categoriaId: categoria.id,
            },
        })
        console.log('✅ Produto criado:', prod.nome)
    }

    // 5. CRIAR USUÁRIO ADMIN
    const senhaHash = await bcrypt.hash('admin123', 10)

    const admin = await prisma.usuario.upsert({
        where: { email: 'admin@nenempneus.com' },
        update: {},
        create: {
            lojaId: loja.id,
            nome: 'Admin NenemPneus',
            email: 'admin@nenempneus.com',
            senhaHash: senhaHash,
            role: 'admin',
            ativo: true,
        },
    })
    console.log('✅ Usuário admin criado:', admin.email)

    console.log('\n🎉 Seed concluído com sucesso!')
    console.log(`📊 Resumo:`)
    console.log(`   - 1 loja (${loja.nome})`)
    console.log(`   - 1 categoria`)
    console.log(`   - ${produtos.length} produtos`)
    console.log(`   - 1 usuário admin`)
    console.log(`\n🔐 Credenciais Admin:`)
    console.log(`   Email: admin@nenempneus.com`)
    console.log(`   Senha: admin123`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Erro no seed:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
