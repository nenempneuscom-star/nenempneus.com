import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Cliente server-side (admin)
export function getServiceSupabase() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // Retorna null ou lança erro dependendo da estratégia de erro desejada
        // Por enquanto vamos lançar erro para garantir configuração correta em dev
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )
}
