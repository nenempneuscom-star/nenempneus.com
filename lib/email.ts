import { Resend } from 'resend'
import { LOJA_INFO } from './constants'

interface ItemPedido {
    nome: string
    quantidade: number
    precoUnit: number
    subtotal: number
    imagemUrl?: string
}

interface DadosPedido {
    numero: string
    cliente: {
        nome: string
        email: string
        telefone?: string
    }
    items: ItemPedido[]
    subtotal: number
    desconto: number
    total: number
    agendamento?: {
        data: string
        hora: string
    }
    createdAt: Date
}

export async function enviarEmailConfirmacaoPedido(pedido: DadosPedido) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const dataFormatada = new Date(pedido.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    const primeiroNome = pedido.cliente.nome.split(' ')[0]

    const itemsHtml = pedido.items.map(item => `
        <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #2a2a2a;">
                <table cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                        <td width="70" style="vertical-align:top;">
                            ${item.imagemUrl
            ? `<img src="${item.imagemUrl}" alt="${item.nome}" width="60" height="60" style="border-radius:10px;object-fit:cover;border:2px solid #333;">`
            : `<div style="width:60px;height:60px;background:linear-gradient(135deg,#333 0%,#1a1a1a 100%);border-radius:10px;display:flex;align-items:center;justify-content:center;border:2px solid #333;">
                                    <span style="font-size:24px;">🛞</span>
                                </div>`
        }
                        </td>
                        <td style="padding-left:15px;vertical-align:top;">
                            <p style="margin:0 0 6px;font-weight:600;color:#fff;font-size:15px;line-height:1.3;">${item.nome}</p>
                            <p style="margin:0;color:#888;font-size:13px;">Qtd: ${item.quantidade} × R$ ${item.precoUnit.toFixed(2).replace('.', ',')}</p>
                        </td>
                        <td style="text-align:right;vertical-align:middle;white-space:nowrap;">
                            <p style="margin:0;color:#fff;font-size:16px;font-weight:700;">R$ ${item.subtotal.toFixed(2).replace('.', ',')}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    `).join('')

    const itemsTexto = pedido.items.map(item =>
        `   ${item.quantidade}x ${item.nome}\n   R$ ${item.precoUnit.toFixed(2).replace('.', ',')} cada = R$ ${item.subtotal.toFixed(2).replace('.', ',')}`
    ).join('\n\n')

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <title>Pedido Confirmado - NenemPneus.com</title>
</head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

    <!-- Container Principal -->
    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#000;">
        <tr>
            <td align="center" style="padding:20px;">
                <table width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">

                    <!-- Header com Celebração -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#D32F2F 0%,#b71c1c 50%,#8B0000 100%);padding:50px 40px;text-align:center;border-radius:20px 20px 0 0;position:relative;">

                            <!-- Logo -->
                            <img src="https://nenempneus.com/logoT.png" alt="NenemPneus.com" width="160" style="max-width:160px;margin-bottom:25px;">

                            <!-- Título Principal -->
                            <h1 style="margin:0;color:#fff;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 2px 10px rgba(0,0,0,0.3);">
                                Compra Confirmada!
                            </h1>
                            <p style="margin:12px 0 0;color:rgba(255,255,255,0.9);font-size:16px;font-weight:400;">
                                Seu pedido foi aprovado com sucesso
                            </p>

                            <!-- Badge de Sucesso -->
                            <div style="margin-top:25px;">
                                <span style="display:inline-block;background:rgba(255,255,255,0.2);backdrop-filter:blur(10px);color:#fff;padding:10px 24px;border-radius:50px;font-size:13px;font-weight:600;letter-spacing:0.5px;border:1px solid rgba(255,255,255,0.3);">
                                    ✓ PAGAMENTO APROVADO
                                </span>
                            </div>
                        </td>
                    </tr>

                    <!-- Corpo do Email -->
                    <tr>
                        <td style="background:#111;padding:0;">

                            <!-- Saudação -->
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding:35px 40px 25px;text-align:center;">
                                        <p style="margin:0;color:#fff;font-size:20px;font-weight:500;">
                                            Olá, <span style="color:#D32F2F;font-weight:700;">${primeiroNome}</span>!
                                        </p>
                                        <p style="margin:10px 0 0;color:#888;font-size:14px;line-height:1.6;">
                                            Obrigado por escolher a NenemPneus.com.<br>
                                            Seu pedido está confirmado e pronto para instalação.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Card do Pedido -->
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding:0 25px 30px;">
                                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

                                            <!-- Header do Card -->
                                            <tr>
                                                <td style="background:linear-gradient(90deg,#1f1f1f 0%,#252525 100%);padding:20px 25px;border-bottom:1px solid #2a2a2a;">
                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td>
                                                                <p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">Número do Pedido</p>
                                                                <p style="margin:5px 0 0;color:#D32F2F;font-size:24px;font-weight:800;font-family:'Courier New',monospace;">#${pedido.numero}</p>
                                                            </td>
                                                            <td style="text-align:right;">
                                                                <p style="margin:0;color:#666;font-size:12px;">${dataFormatada}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>

                                            <!-- Itens -->
                                            <tr>
                                                <td style="padding:5px 0;">
                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                        ${itemsHtml}
                                                    </table>
                                                </td>
                                            </tr>

                                            <!-- Totais -->
                                            <tr>
                                                <td style="padding:20px 25px;background:#151515;border-top:1px solid #2a2a2a;">
                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="padding:5px 0;">
                                                                <span style="color:#888;font-size:14px;">Subtotal</span>
                                                            </td>
                                                            <td style="text-align:right;padding:5px 0;">
                                                                <span style="color:#ccc;font-size:14px;">R$ ${pedido.subtotal.toFixed(2).replace('.', ',')}</span>
                                                            </td>
                                                        </tr>
                                                        ${pedido.desconto > 0 ? `
                                                        <tr>
                                                            <td style="padding:5px 0;">
                                                                <span style="color:#4ade80;font-size:14px;">Desconto</span>
                                                            </td>
                                                            <td style="text-align:right;padding:5px 0;">
                                                                <span style="color:#4ade80;font-size:14px;">- R$ ${pedido.desconto.toFixed(2).replace('.', ',')}</span>
                                                            </td>
                                                        </tr>
                                                        ` : ''}
                                                        <tr>
                                                            <td colspan="2" style="padding:15px 0 0;">
                                                                <div style="border-top:2px solid #2a2a2a;padding-top:15px;">
                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                                        <tr>
                                                                            <td>
                                                                                <span style="color:#fff;font-size:18px;font-weight:700;">Total Pago</span>
                                                                            </td>
                                                                            <td style="text-align:right;">
                                                                                <span style="color:#D32F2F;font-size:28px;font-weight:800;">R$ ${pedido.total.toFixed(2).replace('.', ',')}</span>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Agendamento -->
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding:0 25px 30px;">
                                        ${pedido.agendamento ? `
                                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg,#132a13 0%,#1e3a1e 100%);border-radius:16px;border:1px solid #2d5a2d;overflow:hidden;">
                                            <tr>
                                                <td style="padding:25px 30px;">
                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td width="50" style="vertical-align:top;">
                                                                <div style="width:44px;height:44px;background:#4ade80;border-radius:12px;text-align:center;line-height:44px;">
                                                                    <span style="font-size:20px;">✓</span>
                                                                </div>
                                                            </td>
                                                            <td style="padding-left:15px;">
                                                                <p style="margin:0;color:#4ade80;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Agendamento Confirmado</p>
                                                                <p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">${pedido.agendamento.data}</p>
                                                                <p style="margin:4px 0 0;color:#a0a0a0;font-size:15px;">às ${pedido.agendamento.hora}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        ` : `
                                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg,#2d2410 0%,#3d3215 100%);border-radius:16px;border:1px solid #5a4a2a;overflow:hidden;">
                                            <tr>
                                                <td style="padding:25px 30px;">
                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td width="50" style="vertical-align:top;">
                                                                <div style="width:44px;height:44px;background:#fbbf24;border-radius:12px;text-align:center;line-height:44px;">
                                                                    <span style="font-size:20px;">⏰</span>
                                                                </div>
                                                            </td>
                                                            <td style="padding-left:15px;">
                                                                <p style="margin:0;color:#fbbf24;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Agende sua Instalação</p>
                                                                <p style="margin:8px 0 0;color:#d0d0d0;font-size:14px;line-height:1.5;">
                                                                    Entre em contato para agendar a instalação dos seus pneus.
                                                                </p>
                                                                <a href="https://wa.me/${LOJA_INFO.whatsapp}?text=${encodeURIComponent(`Olá! Fiz o pedido #${pedido.numero} e gostaria de agendar a instalação.`)}"
                                                                   style="display:inline-block;margin-top:15px;background:#25D366;color:#fff;text-decoration:none;padding:12px 24px;border-radius:50px;font-size:13px;font-weight:600;">
                                                                    Agendar pelo WhatsApp
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        `}
                                    </td>
                                </tr>
                            </table>

                            <!-- Local de Instalação -->
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding:0 25px 30px;">
                                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1a1a1a;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
                                            <tr>
                                                <td style="padding:25px 30px;">
                                                    <p style="margin:0 0 15px;color:#fff;font-size:14px;font-weight:600;">
                                                        <span style="margin-right:8px;">📍</span> Local de Instalação
                                                    </p>
                                                    <p style="margin:0 0 5px;color:#d0d0d0;font-size:15px;font-weight:600;">${LOJA_INFO.nome}</p>
                                                    <p style="margin:0 0 3px;color:#888;font-size:13px;">${LOJA_INFO.endereco}</p>
                                                    <p style="margin:0 0 20px;color:#888;font-size:13px;">${LOJA_INFO.cidade} - ${LOJA_INFO.estado}, CEP: ${LOJA_INFO.cep}</p>

                                                    <table cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="padding-right:10px;">
                                                                <a href="https://wa.me/${LOJA_INFO.whatsapp}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:12px;font-weight:600;">
                                                                    WhatsApp
                                                                </a>
                                                            </td>
                                                            <td>
                                                                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${LOJA_INFO.endereco}, ${LOJA_INFO.cidade} - ${LOJA_INFO.estado}`)}" style="display:inline-block;background:#4285f4;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:12px;font-weight:600;">
                                                                    Ver no Mapa
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Dicas -->
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding:0 25px 30px;">
                                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg,#0d1b2a 0%,#1b263b 100%);border-radius:16px;border:1px solid #1e3a5f;overflow:hidden;">
                                            <tr>
                                                <td style="padding:25px 30px;">
                                                    <p style="margin:0 0 18px;color:#60a5fa;font-size:14px;font-weight:600;">
                                                        <span style="margin-right:8px;">💡</span> Dicas para sua Instalação
                                                    </p>
                                                    <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                                        <tr>
                                                            <td style="padding:8px 0;color:#a0a0a0;font-size:13px;line-height:1.5;">
                                                                <span style="color:#60a5fa;margin-right:10px;">•</span>
                                                                Chegue <strong style="color:#fff;">10 minutos antes</strong> do horário
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:8px 0;color:#a0a0a0;font-size:13px;line-height:1.5;">
                                                                <span style="color:#60a5fa;margin-right:10px;">•</span>
                                                                Traga um <strong style="color:#fff;">documento do veículo</strong>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:8px 0;color:#a0a0a0;font-size:13px;line-height:1.5;">
                                                                <span style="color:#60a5fa;margin-right:10px;">•</span>
                                                                Instalação em <strong style="color:#fff;">30-45 minutos</strong>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:8px 0;color:#a0a0a0;font-size:13px;line-height:1.5;">
                                                                <span style="color:#60a5fa;margin-right:10px;">•</span>
                                                                <strong style="color:#fff;">Calibragem gratuita</strong> inclusa
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA -->
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding:10px 25px 40px;text-align:center;">
                                        <a href="https://nenempneus.com/minha-conta/pedidos/${pedido.numero}"
                                           style="display:inline-block;background:linear-gradient(135deg,#D32F2F 0%,#b71c1c 100%);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                                            Ver Detalhes do Pedido
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#0a0a0a;padding:30px 40px;text-align:center;border-radius:0 0 20px 20px;border-top:1px solid #1a1a1a;">
                            <p style="margin:0 0 15px;color:#666;font-size:12px;">
                                Dúvidas? Entre em contato conosco
                            </p>
                            <p style="margin:0 0 20px;">
                                <a href="mailto:${LOJA_INFO.email}" style="color:#888;font-size:13px;text-decoration:none;">${LOJA_INFO.email}</a>
                                <span style="color:#333;margin:0 15px;">|</span>
                                <a href="tel:+${LOJA_INFO.whatsapp}" style="color:#888;font-size:13px;text-decoration:none;">${LOJA_INFO.whatsappDisplay}</a>
                            </p>
                            <p style="margin:0 0 5px;color:#444;font-size:11px;">
                                ${LOJA_INFO.razaoSocial}
                            </p>
                            <p style="margin:0;color:#333;font-size:10px;">
                                CNPJ: ${LOJA_INFO.cnpj}
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>
    `

    // Versão texto plano para o cliente
    const textoPlano = `PEDIDO CONFIRMADO - NenemPneus.com

Olá ${primeiroNome}!

Obrigado por escolher a NenemPneus.com.
Seu pedido foi aprovado e está confirmado.

═══════════════════════════════════════
DETALHES DO PEDIDO
═══════════════════════════════════════

Pedido: #${pedido.numero}
Data: ${dataFormatada}
Status: PAGAMENTO APROVADO

───────────────────────────────────────
ITENS DO PEDIDO
───────────────────────────────────────

${itemsTexto}

───────────────────────────────────────
RESUMO
───────────────────────────────────────

Subtotal: R$ ${pedido.subtotal.toFixed(2).replace('.', ',')}${pedido.desconto > 0 ? `\nDesconto: - R$ ${pedido.desconto.toFixed(2).replace('.', ',')}` : ''}
TOTAL PAGO: R$ ${pedido.total.toFixed(2).replace('.', ',')}

═══════════════════════════════════════
${pedido.agendamento
            ? `AGENDAMENTO CONFIRMADO
═══════════════════════════════════════

Data: ${pedido.agendamento.data}
Horário: ${pedido.agendamento.hora}

Compareça no horário agendado para instalação.`
            : `AGENDE SUA INSTALAÇÃO
═══════════════════════════════════════

Entre em contato para agendar:
WhatsApp: https://wa.me/${LOJA_INFO.whatsapp}`}

═══════════════════════════════════════
LOCAL DE INSTALAÇÃO
═══════════════════════════════════════

${LOJA_INFO.nome}
${LOJA_INFO.endereco}
${LOJA_INFO.cidade} - ${LOJA_INFO.estado}
CEP: ${LOJA_INFO.cep}

───────────────────────────────────────
DICAS PARA SUA INSTALAÇÃO
───────────────────────────────────────

- Chegue 10 minutos antes do horário
- Traga um documento do veículo
- Instalação em 30-45 minutos
- Calibragem gratuita inclusa

═══════════════════════════════════════

Dúvidas? Entre em contato:
Email: ${LOJA_INFO.email}
Telefone: ${LOJA_INFO.whatsappDisplay}
WhatsApp: https://wa.me/${LOJA_INFO.whatsapp}

--
${LOJA_INFO.razaoSocial}
CNPJ: ${LOJA_INFO.cnpj}
`

    // Enviar email para o cliente
    await resend.emails.send({
        from: `NenemPneus.com <contato@nenempneus.com>`,
        replyTo: 'contato@nenempneus.com',
        to: [pedido.cliente.email],
        subject: `Pedido #${pedido.numero} Confirmado - NenemPneus.com`,
        text: textoPlano,
        html
    })

    // Versão texto plano para notificação da loja
    const textoLojaPlano = `NOVO PEDIDO RECEBIDO

VALOR: R$ ${pedido.total.toFixed(2).replace('.', ',')}

Pedido: #${pedido.numero}
Data: ${dataFormatada}

CLIENTE
Nome: ${pedido.cliente.nome}
Email: ${pedido.cliente.email}${pedido.cliente.telefone ? `\nTelefone: ${pedido.cliente.telefone}` : ''}

ITENS
${pedido.items.map(item => `- ${item.quantidade}x ${item.nome} = R$ ${item.subtotal.toFixed(2).replace('.', ',')}`).join('\n')}

${pedido.agendamento
            ? `AGENDAMENTO: ${pedido.agendamento.data} às ${pedido.agendamento.hora}`
            : `PENDENTE: Cliente ainda não agendou a instalação`}
`

    // Enviar notificação para a loja
    await resend.emails.send({
        from: `NenemPneus.com <contato@nenempneus.com>`,
        to: ['contato@nenempneus.com'],
        subject: `Novo Pedido #${pedido.numero} - R$ ${pedido.total.toFixed(2).replace('.', ',')}`,
        text: textoLojaPlano,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a1a;padding:20px;border-radius:12px;">
                <div style="background:#D32F2F;padding:25px;text-align:center;border-radius:12px 12px 0 0;">
                    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Novo Pedido Recebido!</h1>
                </div>
                <div style="padding:25px;background:#242424;border-radius:0 0 12px 12px;">
                    <p style="color:#4ade80;font-size:32px;font-weight:800;text-align:center;margin:0 0 25px;">
                        R$ ${pedido.total.toFixed(2).replace('.', ',')}
                    </p>
                    <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                        <tr>
                            <td style="padding:10px 0;border-bottom:1px solid #333;">
                                <span style="color:#888;font-size:13px;">Pedido</span><br>
                                <span style="color:#fff;font-size:16px;font-weight:600;">#${pedido.numero}</span>
                            </td>
                            <td style="padding:10px 0;border-bottom:1px solid #333;text-align:right;">
                                <span style="color:#888;font-size:13px;">Data</span><br>
                                <span style="color:#fff;font-size:14px;">${dataFormatada}</span>
                            </td>
                        </tr>
                    </table>
                    <div style="background:#1a1a1a;padding:15px;border-radius:8px;margin-bottom:20px;">
                        <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Cliente</p>
                        <p style="color:#fff;font-size:15px;font-weight:600;margin:0 0 5px;">${pedido.cliente.nome}</p>
                        <p style="color:#a0a0a0;font-size:13px;margin:0;">${pedido.cliente.email}</p>
                        ${pedido.cliente.telefone ? `<p style="color:#a0a0a0;font-size:13px;margin:5px 0 0;">${pedido.cliente.telefone}</p>` : ''}
                    </div>
                    <div style="background:#1a1a1a;padding:15px;border-radius:8px;margin-bottom:20px;">
                        <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Itens</p>
                        ${pedido.items.map(item => `
                            <p style="color:#d0d0d0;font-size:14px;margin:0 0 8px;padding-bottom:8px;border-bottom:1px solid #2a2a2a;">
                                <strong style="color:#fff;">${item.quantidade}x</strong> ${item.nome}
                                <span style="float:right;color:#fff;">R$ ${item.subtotal.toFixed(2).replace('.', ',')}</span>
                            </p>
                        `).join('')}
                    </div>
                    ${pedido.agendamento ? `
                    <div style="background:#132a13;padding:15px;border-radius:8px;border-left:4px solid #4ade80;">
                        <p style="color:#4ade80;font-size:14px;margin:0;font-weight:600;">
                            Agendado: ${pedido.agendamento.data} às ${pedido.agendamento.hora}
                        </p>
                    </div>
                    ` : `
                    <div style="background:#2d2410;padding:15px;border-radius:8px;border-left:4px solid #fbbf24;">
                        <p style="color:#fbbf24;font-size:14px;margin:0;font-weight:600;">
                            Cliente ainda não agendou a instalação
                        </p>
                    </div>
                    `}
                </div>
            </div>
        `
    })

    console.log(`Email de confirmação enviado para ${pedido.cliente.email}`)
}
