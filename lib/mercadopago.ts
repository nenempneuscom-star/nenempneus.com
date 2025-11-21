import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

// Usar placeholder temporário se não configurado (apenas para build)
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-placeholder-temp'

const client = new MercadoPagoConfig({
    accessToken: accessToken,
})

export const mercadoPagoPreference = new Preference(client)
export const mercadoPagoPayment = new Payment(client)
