import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')

if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf-8')
    console.log('Original content length:', content.length)

    const lines = content.split('\n')
    let fixedLines = []
    let changed = false

    for (let line of lines) {
        let trimmed = line.trim()

        // Se a linha tem o protocolo postgres mas não começa com DATABASE_URL corretamente
        if ((trimmed.includes('postgres://') || trimmed.includes('postgresql://')) && !trimmed.startsWith('#')) {
            // Remove export se existir
            if (trimmed.startsWith('export ')) {
                trimmed = trimmed.replace('export ', '')
                changed = true
            }

            // Se não começa com DATABASE_URL=
            if (!trimmed.startsWith('DATABASE_URL=')) {
                // Tenta extrair a URL
                const match = trimmed.match(/(postgres(?:ql)?:\/\/[^\s]+)/)
                if (match) {
                    trimmed = `DATABASE_URL="${match[1]}"`
                    changed = true
                }
            } else {
                // Se já começa com DATABASE_URL=, verifica aspas
                const parts = trimmed.split('=')
                let value = parts.slice(1).join('=') // caso tenha = na senha
                value = value.trim()

                // Se não tem aspas e tem caracteres especiais, coloca aspas
                if (!value.startsWith('"') && !value.startsWith("'")) {
                    trimmed = `DATABASE_URL="${value}"`
                    changed = true
                }
            }
        }
        fixedLines.push(trimmed)
    }

    const newContent = fixedLines.join('\n')

    if (changed) {
        fs.writeFileSync(envPath, newContent)
        console.log('Fixed formatting in .env.local (normalized DATABASE_URL)')
    } else {
        console.log('No formatting changes needed.')
    }
} else {
    console.error('File not found')
}
