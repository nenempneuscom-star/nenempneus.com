import { SendMessagePayload, SendTemplatePayload, SendInteractivePayload } from './types'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0'

export class WhatsAppClient {
    private phoneNumberId: string
    private accessToken: string

    constructor() {
        // Usar placeholders temporários se não configurado (para build)
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '962284886958202'
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

    // Enviar mensagem com botões interativos
    async sendInteractiveButtons(
        to: string,
        bodyText: string,
        buttons: Array<{ id: string; title: string }>
    ): Promise<any> {
        const payload: SendInteractivePayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace(/\D/g, ''),
            type: 'interactive',
            interactive: {
                type: 'button',
                body: { text: bodyText },
                action: {
                    buttons: buttons.map((btn) => ({
                        type: 'reply',
                        reply: { id: btn.id, title: btn.title },
                    })),
                },
            },
        }

        return this.sendRequest(payload)
    }

    // Enviar mensagem com lista de opções
    async sendInteractiveList(
        to: string,
        bodyText: string,
        buttonText: string,
        sections: Array<{
            title: string
            rows: Array<{ id: string; title: string; description?: string }>
        }>
    ): Promise<any> {
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace(/\D/g, ''),
            type: 'interactive',
            interactive: {
                type: 'list',
                body: { text: bodyText },
                action: {
                    button: buttonText,
                    sections,
                },
            },
        }

        return this.sendRequest(payload)
    }

    // Enviar link com preview
    async sendMessageWithLink(to: string, message: string, link: string): Promise<any> {
        const payload: SendMessagePayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace(/\D/g, ''),
            type: 'text',
            text: {
                preview_url: true,
                body: `${message}\n\n${link}`,
            },
        }

        return this.sendRequest(payload)
    }

    // Método privado para enviar requisições
    private async sendRequest(payload: any): Promise<any> {
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

            return await response.json()
        } catch (error) {
            console.error('Erro na requisição WhatsApp:', error)
            throw error
        }
    }
}
