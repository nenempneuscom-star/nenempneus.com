import { SendMessagePayload } from './types'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'

export class WhatsAppClient {
    private phoneNumberId: string
    private accessToken: string

    constructor() {
        // Usar placeholders temporários se não configurado (para build)
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || 'placeholder-phone-id'
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || 'placeholder-token'
    }

    async sendMessage(to: string, message: string): Promise<any> {
        const payload: SendMessagePayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace(/\D/g, ''), // Remove caracteres não numéricos
            type: 'text',
            text: {
                preview_url: false,
                body: message,
            },
        }

        try {
            const response = await fetch(
                `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                    body: JSON.stringify(payload),
                }
            )

            if (!response.ok) {
                const error = await response.json()
                console.error('Erro ao enviar mensagem WhatsApp:', error)
                throw new Error(error.error?.message || 'Erro ao enviar mensagem')
            }

            const data = await response.json()
            return data
        } catch (error) {
            console.error('Erro na requisição WhatsApp:', error)
            throw error
        }
    }

    async markAsRead(messageId: string): Promise<void> {
        try {
            await fetch(
                `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        status: 'read',
                        message_id: messageId,
                    }),
                }
            )
        } catch (error) {
            console.error('Erro ao marcar como lida:', error)
        }
    }
}
