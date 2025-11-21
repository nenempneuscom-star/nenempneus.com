// Cache simples em memória
// Em produção, usar Redis

interface CacheItem {
  resposta: string
  timestamp: number
}

const cache = new Map<string, CacheItem>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hora

export function getCachedResponse(mensagem: string): string | null {
  const key = normalizeMessage(mensagem)
  const item = cache.get(key)

  if (!item) return null

  // Verificar se expirou
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return item.resposta
}

export function setCachedResponse(mensagem: string, resposta: string): void {
  const key = normalizeMessage(mensagem)
  cache.set(key, {
    resposta,
    timestamp: Date.now(),
  })
}

function normalizeMessage(mensagem: string): string {
  return mensagem
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

// Perguntas frequentes com respostas fixas
const FAQ: Record<string, string> = {
  'ola': 'Olá! Como posso ajudar você hoje?',
  'oi': 'Oi! Em que posso ser útil?',
  'horario': 'Atendemos de segunda a sábado, das 8h às 18h.',
  'endereco': 'Estamos em Capivari de Baixo, SC. Rua Principal, 123 - Centro.',
  'telefone': 'Nosso telefone é (48) 99997-3889.',
  'preco': 'Nossos pneus seminovos começam a partir de R$380. Os preços variam conforme marca, aro e modelo.',
  'garantia': 'Todos nossos pneus têm garantia de qualidade!',
  'instalacao': 'Sim! Fazemos a instalação no mesmo dia da compra, mediante agendamento.',
}

export function getQuickResponse(mensagem: string): string | null {
  const key = normalizeMessage(mensagem)

  // Buscar correspondência exata
  if (FAQ[key]) return FAQ[key]

  // Buscar correspondência parcial
  for (const [pergunta, resposta] of Object.entries(FAQ)) {
    if (key.includes(pergunta)) {
      return resposta
    }
  }

  return null
}
