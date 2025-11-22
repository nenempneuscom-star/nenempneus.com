import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')

console.log('Checking .env.local at:', envPath)

if (fs.existsSync(envPath)) {
    console.log('File exists!')
    const result = dotenv.config({ path: envPath })

    if (result.error) {
        console.error('Error parsing .env.local:', result.error)
    } else {
        console.log('Parsed successfully.')
        console.log('Keys found:', Object.keys(result.parsed || {}))
        console.log('DATABASE_URL loaded?', !!process.env.DATABASE_URL)
        if (process.env.DATABASE_URL) {
            console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 15) + '...')
        } else {
            console.log('DATABASE_URL is empty or undefined')
        }
    }
} else {
    console.error('File .env.local NOT found!')
}
