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

    const itemsHtml = pedido.items.map(item => `
        <tr>
            <td style="padding:15px;border-bottom:1px solid #333;">
                <div style="display:flex;align-items:center;gap:15px;">
                    ${item.imagemUrl ? `<img src="${item.imagemUrl}" alt="${item.nome}" width="60" height="60" style="border-radius:8px;object-fit:cover;">` : ''}
                    <div>
                        <p style="margin:0;font-weight:600;color:#fff;font-size:14px;">${item.nome}</p>
                        <p style="margin:5px 0 0;color:#888;font-size:12px;">Quantidade: ${item.quantidade}</p>
                    </div>
                </div>
            </td>
            <td style="padding:15px;border-bottom:1px solid #333;text-align:right;color:#fff;font-size:14px;">
                R$ ${item.subtotal.toFixed(2).replace('.', ',')}
            </td>
        </tr>
    `).join('')

    const agendamentoHtml = pedido.agendamento ? `
        <div style="background:linear-gradient(135deg,#1a472a 0%,#2d5a3d 100%);border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #4ade80;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <span style="font-size:24px;">📅</span>
                <h3 style="margin:0;color:#4ade80;font-size:16px;">Agendamento Confirmado!</h3>
            </div>
            <p style="margin:0;color:#fff;font-size:18px;font-weight:600;">
                ${pedido.agendamento.data} às ${pedido.agendamento.hora}
            </p>
            <p style="margin:10px 0 0;color:#a0a0a0;font-size:13px;">
                Compareça no horário agendado para instalação dos seus pneus.
            </p>
        </div>
    ` : `
        <div style="background:linear-gradient(135deg,#3d2d14 0%,#4a3a1a 100%);border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #fbbf24;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <span style="font-size:24px;">⏰</span>
                <h3 style="margin:0;color:#fbbf24;font-size:16px;">Agende sua Instalação</h3>
            </div>
            <p style="margin:0;color:#d0d0d0;font-size:14px;">
                Entre em contato para agendar a instalação dos seus pneus em nossa loja.
            </p>
            <a href="https://wa.me/${LOJA_INFO.whatsapp}?text=${encodeURIComponent(`Olá! Fiz o pedido #${pedido.numero} e gostaria de agendar a instalação.`)}"
               style="display:inline-block;margin-top:15px;background:#25D366;color:#fff;text-decoration:none;padding:10px 20px;border-radius:25px;font-size:13px;font-weight:600;">
                📱 Agendar pelo WhatsApp
            </a>
        </div>
    `

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#0a0a0a;">

        <!-- Header com Celebração -->
        <div style="background:linear-gradient(135deg,#D32F2F 0%,#b71c1c 100%);padding:40px 20px;text-align:center;position:relative;overflow:hidden;">
            <div style="position:absolute;top:10px;left:20px;font-size:30px;opacity:0.3;">🎉</div>
            <div style="position:absolute;top:15px;right:25px;font-size:25px;opacity:0.3;">✨</div>
            <div style="position:absolute;bottom:10px;left:40px;font-size:20px;opacity:0.3;">🏆</div>
            <div style="position:absolute;bottom:15px;right:30px;font-size:28px;opacity:0.3;">🎊</div>

            <img src="https://nenempneus.com/logoT.png" alt="NenemPneus.com" width="180" style="max-width:180px;margin-bottom:20px;">

            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                🎉 Parabéns pela Compra!
            </h1>
            <p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:16px;">
                Seu pedido foi confirmado com sucesso
            </p>
        </div>

        <!-- Corpo do Email -->
        <div style="padding:30px 20px;">

            <!-- Saudação -->
            <div style="text-align:center;margin-bottom:30px;">
                <p style="margin:0;color:#fff;font-size:18px;">
                    Olá, <strong style="color:#D32F2F;">${pedido.cliente.nome.split(' ')[0]}</strong>! 👋
                </p>
                <p style="margin:10px 0 0;color:#888;font-size:14px;">
                    Obrigado por escolher a <strong style="color:#fff;">NenemPneus.com</strong>
                </p>
            </div>

            <!-- Card do Pedido -->
            <div style="background:linear-gradient(145deg,#1a1a1a 0%,#242424 100%);border-radius:16px;padding:25px;margin-bottom:25px;border:1px solid #333;">

                <!-- Número do Pedido -->
                <div style="text-align:center;padding-bottom:20px;border-bottom:1px dashed #333;margin-bottom:20px;">
                    <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Número do Pedido</p>
                    <p style="margin:5px 0;color:#D32F2F;font-size:28px;font-weight:700;font-family:monospace;">#${pedido.numero}</p>
                    <p style="margin:0;color:#666;font-size:12px;">${dataFormatada}</p>
                </div>

                <!-- Status -->
                <div style="text-align:center;margin-bottom:20px;">
                    <span style="display:inline-block;background:linear-gradient(135deg,#059669 0%,#047857 100%);color:#fff;padding:8px 20px;border-radius:25px;font-size:13px;font-weight:600;">
                        ✓ PAGAMENTO APROVADO
                    </span>
                </div>

                <!-- Itens do Pedido -->
                <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                    <tr>
                        <td style="padding:10px 15px;background:#1f1f1f;border-radius:8px 8px 0 0;">
                            <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">🛞 Seus Pneus</p>
                        </td>
                        <td style="padding:10px 15px;background:#1f1f1f;border-radius:8px 8px 0 0;text-align:right;">
                            <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Valor</p>
                        </td>
                    </tr>
                    ${itemsHtml}
                </table>

                <!-- Totais -->
                <div style="background:#1f1f1f;border-radius:12px;padding:15px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span style="color:#888;font-size:14px;">Subtotal</span>
                        <span style="color:#fff;font-size:14px;">R$ ${pedido.subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    ${pedido.desconto > 0 ? `
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span style="color:#4ade80;font-size:14px;">Desconto</span>
                        <span style="color:#4ade80;font-size:14px;">- R$ ${pedido.desconto.toFixed(2).replace('.', ',')}</span>
                    </div>
                    ` : ''}
                    <div style="border-top:1px solid #333;padding-top:12px;margin-top:8px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="color:#fff;font-size:16px;font-weight:600;">Total Pago</span>
                            <span style="color:#D32F2F;font-size:24px;font-weight:700;">R$ ${pedido.total.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Agendamento -->
            ${agendamentoHtml}

            <!-- Informações da Loja -->
            <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin-bottom:25px;border:1px solid #2a2a2a;">
                <h3 style="margin:0 0 15px;color:#fff;font-size:14px;display:flex;align-items:center;gap:8px;">
                    📍 Local de Instalação
                </h3>
                <p style="margin:0 0 5px;color:#d0d0d0;font-size:14px;font-weight:600;">${LOJA_INFO.nome}</p>
                <p style="margin:0 0 5px;color:#888;font-size:13px;">${LOJA_INFO.endereco}</p>
                <p style="margin:0 0 15px;color:#888;font-size:13px;">${LOJA_INFO.cidade} - ${LOJA_INFO.estado}, CEP: ${LOJA_INFO.cep}</p>

                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <a href="https://wa.me/${LOJA_INFO.whatsapp}" style="display:inline-flex;align-items:center;gap:6px;background:#25D366;color:#fff;text-decoration:none;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:600;">
                        📱 WhatsApp
                    </a>
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${LOJA_INFO.endereco}, ${LOJA_INFO.cidade} - ${LOJA_INFO.estado}`)}" style="display:inline-flex;align-items:center;gap:6px;background:#4285f4;color:#fff;text-decoration:none;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:600;">
                        🗺️ Ver no Mapa
                    </a>
                </div>
            </div>

            <!-- Dicas -->
            <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;margin-bottom:25px;border-left:4px solid #3b82f6;">
                <h3 style="margin:0 0 15px;color:#3b82f6;font-size:14px;">💡 Dicas para sua Instalação</h3>
                <ul style="margin:0;padding-left:20px;color:#a0a0a0;font-size:13px;line-height:1.8;">
                    <li>Chegue <strong style="color:#fff;">10 minutos antes</strong> do horário agendado</li>
                    <li>Traga um <strong style="color:#fff;">documento do veículo</strong></li>
                    <li>A instalação leva em média <strong style="color:#fff;">30-45 minutos</strong></li>
                    <li>Oferecemos <strong style="color:#fff;">calibragem gratuita</strong> após instalação</li>
                </ul>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:30px;">
                <a href="https://nenempneus.com/minha-conta/pedidos/${pedido.numero}"
                   style="display:inline-block;background:linear-gradient(135deg,#D32F2F 0%,#b71c1c 100%);color:#fff;text-decoration:none;padding:15px 40px;border-radius:30px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;box-shadow:0 4px 15px rgba(211,47,47,0.4);">
                    Ver Detalhes do Pedido
                </a>
            </div>

            <!-- Garantia -->
            <div style="text-align:center;padding:20px;background:#1a1a1a;border-radius:12px;margin-bottom:20px;">
                <div style="font-size:40px;margin-bottom:10px;">🛡️</div>
                <p style="margin:0;color:#fff;font-size:16px;font-weight:600;">Garantia NenemPneus</p>
                <p style="margin:5px 0 0;color:#888;font-size:13px;">
                    Seus pneus possuem garantia. Fique tranquilo!
                </p>
                <a href="https://nenempneus.com/garantia" style="color:#D32F2F;font-size:12px;text-decoration:none;">
                    Saiba mais sobre nossa garantia →
                </a>
            </div>

        </div>

        <!-- Footer -->
        <div style="background:#111;padding:30px 20px;text-align:center;border-top:1px solid #222;">
            <p style="margin:0 0 10px;color:#666;font-size:12px;">
                Dúvidas? Entre em contato conosco
            </p>
            <p style="margin:0 0 15px;">
                <a href="mailto:${LOJA_INFO.email}" style="color:#888;font-size:12px;text-decoration:none;">${LOJA_INFO.email}</a>
                <span style="color:#333;margin:0 10px;">|</span>
                <a href="tel:${LOJA_INFO.whatsapp}" style="color:#888;font-size:12px;text-decoration:none;">${LOJA_INFO.whatsappDisplay}</a>
            </p>
            <p style="margin:0 0 5px;color:#444;font-size:11px;">
                ${LOJA_INFO.razaoSocial}
            </p>
            <p style="margin:0;color:#333;font-size:10px;">
                CNPJ: ${LOJA_INFO.cnpj}
            </p>
        </div>

    </div>
</body>
</html>
    `

    // Enviar email para o cliente
    await resend.emails.send({
        from: `NenemPneus.com <contato@nenempneus.com>`,
        to: [pedido.cliente.email],
        subject: `🎉 Pedido #${pedido.numero} Confirmado - NenemPneus.com`,
        html
    })

    // Enviar notificação para a loja
    await resend.emails.send({
        from: `NenemPneus.com <contato@nenempneus.com>`,
        to: ['contato@nenempneus.com'],
        subject: `💰 Novo Pedido #${pedido.numero} - R$ ${pedido.total.toFixed(2).replace('.', ',')}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a1a;padding:20px;border-radius:8px;">
                <div style="background:#D32F2F;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
                    <h1 style="color:#fff;margin:0;font-size:20px;">💰 Novo Pedido Recebido!</h1>
                </div>
                <div style="padding:20px;background:#242424;border-radius:0 0 8px 8px;">
                    <p style="color:#4ade80;font-size:24px;font-weight:bold;text-align:center;margin:0 0 20px;">
                        R$ ${pedido.total.toFixed(2).replace('.', ',')}
                    </p>
                    <p style="color:#a0a0a0;margin:0 0 10px;font-size:14px;">
                        <strong style="color:#fff;">Pedido:</strong> #${pedido.numero}
                    </p>
                    <p style="color:#a0a0a0;margin:0 0 10px;font-size:14px;">
                        <strong style="color:#fff;">Cliente:</strong> ${pedido.cliente.nome}
                    </p>
                    <p style="color:#a0a0a0;margin:0 0 10px;font-size:14px;">
                        <strong style="color:#fff;">Email:</strong> ${pedido.cliente.email}
                    </p>
                    ${pedido.cliente.telefone ? `
                    <p style="color:#a0a0a0;margin:0 0 10px;font-size:14px;">
                        <strong style="color:#fff;">Telefone:</strong> ${pedido.cliente.telefone}
                    </p>
                    ` : ''}
                    <div style="border-top:1px solid #333;margin-top:15px;padding-top:15px;">
                        <p style="color:#fff;font-size:14px;margin:0 0 10px;"><strong>Itens:</strong></p>
                        ${pedido.items.map(item => `
                            <p style="color:#d0d0d0;font-size:13px;margin:0 0 5px;">
                                • ${item.quantidade}x ${item.nome} - R$ ${item.subtotal.toFixed(2).replace('.', ',')}
                            </p>
                        `).join('')}
                    </div>
                    ${pedido.agendamento ? `
                    <div style="border-top:1px solid #333;margin-top:15px;padding-top:15px;">
                        <p style="color:#4ade80;font-size:14px;margin:0;">
                            📅 Agendado: ${pedido.agendamento.data} às ${pedido.agendamento.hora}
                        </p>
                    </div>
                    ` : `
                    <div style="border-top:1px solid #333;margin-top:15px;padding-top:15px;">
                        <p style="color:#fbbf24;font-size:14px;margin:0;">
                            ⏰ Cliente ainda não agendou a instalação
                        </p>
                    </div>
                    `}
                </div>
            </div>
        `
    })

    console.log(`Email de confirmação enviado para ${pedido.cliente.email}`)
}
