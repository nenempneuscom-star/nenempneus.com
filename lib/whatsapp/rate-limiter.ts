// Rate limiter simples para evitar spam
interface RateLimitEntry {
  count: number
  firstRequest: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

const MAX_REQUESTS = 10 // Máximo de mensagens
const WINDOW_MS = 60 * 1000 // Por janela de 1 minuto

export function checkRateLimit(telefone: string): {
  allowed: boolean
  remaining: number
} {
  const now = Date.now()
  const entry = rateLimitMap.get(telefone)

  if (!entry) {
    rateLimitMap.set(telefone, {
      count: 1,
      firstRequest: now,
    })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  // Resetar se janela expirou
  if (now - entry.firstRequest > WINDOW_MS) {
    rateLimitMap.set(telefone, {
      count: 1,
      firstRequest: now,
    })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  // Incrementar contador
  entry.count++

  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: MAX_REQUESTS - entry.count }
}

export function getRateLimitMessage(): string {
  return 'Você enviou muitas mensagens. Por favor, aguarde 1 minuto antes de continuar.'
}
