export interface WhatsAppMessage {
    from: string
    id: string
    timestamp: string
    type: 'text' | 'image' | 'audio' | 'video' | 'document'
    text?: {
        body: string
    }
    image?: {
        id: string
        mime_type: string
    }
}

export interface WhatsAppWebhook {
    object: string
    entry: Array<{
        id: string
        changes: Array<{
            value: {
                messaging_product: string
                metadata: {
                    display_phone_number: string
                    phone_number_id: string
                }
                contacts?: Array<{
                    profile: {
                        name: string
                    }
                    wa_id: string
                }>
                messages?: WhatsAppMessage[]
                statuses?: Array<{
                    id: string
                    status: string
                    timestamp: string
                    recipient_id: string
                }>
            }
            field: string
        }>
    }>
}

export interface SendMessagePayload {
    messaging_product: 'whatsapp'
    recipient_type: 'individual'
    to: string
    type: 'text'
    text: {
        preview_url?: boolean
        body: string
    }
}
