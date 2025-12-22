import Groq from 'groq-sdk'

// Inicialização lazy do cliente Groq
let groqClient: Groq | null = null

function getGroq(): Groq {
    if (!groqClient) {
        groqClient = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        })
    }
    return groqClient
}

function getWhatsAppToken(): string {
    return process.env.WHATSAPP_ACCESS_TOKEN || ''
}

/**
 * Baixa um arquivo de mídia do WhatsApp
 * @param mediaId - ID da mídia no WhatsApp
 * @returns Buffer do arquivo ou null se falhar
 */
export async function baixarMidiaWhatsApp(mediaId: string): Promise<Buffer | null> {
    try {
        // Primeiro, obtém a URL do arquivo
        const mediaResponse = await fetch(
            `https://graph.facebook.com/v23.0/${mediaId}`,
            {
                headers: {
                    Authorization: `Bearer ${getWhatsAppToken()}`,
                },
            }
        )

        if (!mediaResponse.ok) {
            console.error('Erro ao obter URL da mídia:', await mediaResponse.text())
            return null
        }

        const mediaData = await mediaResponse.json()
        const mediaUrl = mediaData.url

        if (!mediaUrl) {
            console.error('URL da mídia não encontrada')
            return null
        }

        // Baixa o arquivo
        const fileResponse = await fetch(mediaUrl, {
            headers: {
                Authorization: `Bearer ${getWhatsAppToken()}`,
            },
        })

        if (!fileResponse.ok) {
            console.error('Erro ao baixar mídia:', await fileResponse.text())
            return null
        }

        const arrayBuffer = await fileResponse.arrayBuffer()
        return Buffer.from(arrayBuffer)
    } catch (error) {
        console.error('Erro ao baixar mídia do WhatsApp:', error)
        return null
    }
}

/**
 * Transcreve um arquivo de áudio usando OpenAI Whisper
 * @param audioBuffer - Buffer do arquivo de áudio
 * @param mimeType - Tipo MIME do áudio (ex: audio/ogg, audio/mpeg)
 * @returns Texto transcrito ou null se falhar
 */
export async function transcreverAudio(
    audioBuffer: Buffer,
    mimeType: string = 'audio/ogg'
): Promise<string | null> {
    try {
        // Determina a extensão baseado no mime type
        const extensao = getExtensaoFromMime(mimeType)

        // Cria um File a partir do Buffer para a API do Groq
        const uint8Array = new Uint8Array(audioBuffer)
        const file = new File([uint8Array], `audio.${extensao}`, { type: mimeType })

        const transcription = await getGroq().audio.transcriptions.create({
            file: file,
            model: 'whisper-large-v3',
            language: 'pt', // Português
            response_format: 'text',
        })

        return transcription as unknown as string
    } catch (error) {
        console.error('Erro ao transcrever áudio:', error)
        return null
    }
}

/**
 * Processa uma mensagem de áudio do WhatsApp
 * Baixa o áudio e retorna a transcrição
 * @param mediaId - ID da mídia no WhatsApp
 * @param mimeType - Tipo MIME do áudio
 * @returns Texto transcrito ou mensagem de erro
 */
export async function processarAudioWhatsApp(
    mediaId: string,
    mimeType: string = 'audio/ogg'
): Promise<{ sucesso: boolean; texto: string }> {
    try {
        console.log(`🎤 Processando áudio: ${mediaId}`)

        // 1. Baixa o áudio
        const audioBuffer = await baixarMidiaWhatsApp(mediaId)
        if (!audioBuffer) {
            return {
                sucesso: false,
                texto: '[Não foi possível baixar o áudio]',
            }
        }

        console.log(`📥 Áudio baixado: ${audioBuffer.length} bytes`)

        // 2. Verifica tamanho (limite de 25MB da OpenAI)
        const MAX_SIZE = 25 * 1024 * 1024 // 25MB
        if (audioBuffer.length > MAX_SIZE) {
            return {
                sucesso: false,
                texto: '[Áudio muito longo para processar]',
            }
        }

        // 3. Transcreve
        const transcricao = await transcreverAudio(audioBuffer, mimeType)
        if (!transcricao) {
            return {
                sucesso: false,
                texto: '[Não foi possível transcrever o áudio]',
            }
        }

        console.log(`✅ Áudio transcrito: "${transcricao.substring(0, 100)}..."`)

        return {
            sucesso: true,
            texto: transcricao.trim(),
        }
    } catch (error) {
        console.error('Erro ao processar áudio:', error)
        return {
            sucesso: false,
            texto: '[Erro ao processar áudio]',
        }
    }
}

/**
 * Retorna a extensão de arquivo baseado no MIME type
 */
function getExtensaoFromMime(mimeType: string): string {
    const mimeMap: Record<string, string> = {
        'audio/ogg': 'ogg',
        'audio/ogg; codecs=opus': 'ogg',
        'audio/mpeg': 'mp3',
        'audio/mp4': 'm4a',
        'audio/wav': 'wav',
        'audio/webm': 'webm',
        'audio/amr': 'amr',
    }

    // Pega apenas a parte principal do mime type (antes do ;)
    const mainMime = mimeType.split(';')[0].trim()
    return mimeMap[mainMime] || 'ogg'
}

/**
 * Verifica se um MIME type é de áudio suportado
 */
export function isAudioSuportado(mimeType: string): boolean {
    const tiposSuportados = [
        'audio/ogg',
        'audio/mpeg',
        'audio/mp4',
        'audio/wav',
        'audio/webm',
        'audio/amr',
    ]

    const mainMime = mimeType.split(';')[0].trim()
    return tiposSuportados.includes(mainMime)
}
