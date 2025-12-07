export interface WhatsAppMessage {
    from: string
    id: string
    timestamp: string
    type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'interactive' | 'sticker' | 'location' | 'contacts'
    text?: {
        body: string
    }
    image?: {
        id: string
        mime_type: string
        sha256?: string
    }
    audio?: {
        id: string
        mime_type: string
        sha256?: string
        voice?: boolean // true se for gravação de voz
    }
    video?: {
        id: string
        mime_type: string
        sha256?: string
    }
    document?: {
        id: string
        mime_type: string
        sha256?: string
        filename?: string
    }
    sticker?: {
        id: string
        mime_type: string
    }
    interactive?: {
        type: 'button_reply' | 'list_reply'
        button_reply?: {
            id: string
            title: string
        }
        list_reply?: {
            id: string
            title: string
            description?: string
        }
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

export interface SendTemplatePayload {
    messaging_product: 'whatsapp'
    recipient_type: 'individual'
    to: string
    type: 'template'
    template: {
        name: string
        language: {
            code: string
        }
        components?: Array<{
            type: string
            parameters: Array<{
                type: string
                text?: string
            }>
        }>
    }
}

export interface SendInteractivePayload {
    messaging_product: 'whatsapp'
    recipient_type: 'individual'
    to: string
    type: 'interactive'
    interactive: {
        type: 'button' | 'list'
        header?: {
            type: 'text'
            text: string
        }
        body: {
            text: string
        }
        footer?: {
            text: string
        }
        action: {
            button?: string
            buttons?: Array<{
                type: 'reply'
                reply: {
                    id: string
                    title: string
                }
            }>
            sections?: Array<{
                title: string
                rows: Array<{
                    id: string
                    title: string
                    description?: string
                }>
            }>
        }
    }
}

// =============================================
// TIPOS PARA VENDAS
// =============================================

export interface LeadInfo {
    telefone: string
    nome: string
    conversaId: string
    estagio: 'novo' | 'qualificando' | 'orcamento' | 'negociando' | 'fechando' | 'convertido' | 'perdido'
    interesse?: string
    veiculo?: {
        marca?: string
        modelo?: string
        ano?: number
        medida?: string
    }
    ultimaInteracao: Date
    pontuacao: number
}

export interface ProdutoRecomendado {
    id: string
    nome: string
    preco: number
    estoque: number
    marca: string
    medida: string
    imagemUrl?: string
    destaque?: boolean
}

export interface Orcamento {
    id: string
    produtos: Array<{
        produtoId: string
        nome: string
        quantidade: number
        precoUnit: number
        subtotal: number
    }>
    subtotal: number
    servicos: {
        instalacao: number
        alinhamento: number
        balanceamento: number
    }
    total: number
    validade: Date
    checkoutUrl?: string
}

export interface IntencaoCliente {
    tipo: 'compra' | 'informacao' | 'suporte' | 'agendamento' | 'reclamacao' | 'outro'
    confianca: number
    detalhes?: string
}
