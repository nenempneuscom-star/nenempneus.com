import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { nome, email, telefone, assunto, mensagem } = await request.json()

        // Validação básica
        if (!nome || !email || !mensagem) {
            return NextResponse.json(
                { error: 'Nome, email e mensagem são obrigatórios' },
                { status: 400 }
            )
        }

        // Email para a loja (notificação de novo contato)
        await resend.emails.send({
            from: 'NenemPneus.com <contato@nenempneus.com>',
            to: ['contato@nenempneus.com'],
            subject: assunto ? `[Site] ${assunto}` : `[Site] Nova mensagem de ${nome}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a1a;padding:20px;border-radius:8px;">
                    <div style="background:#D32F2F;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
                        <h1 style="color:#fff;margin:0;font-size:20px;">Nova Mensagem do Site</h1>
                    </div>
                    <div style="padding:20px;background:#242424;border-radius:0 0 8px 8px;">
                        <p style="color:#a0a0a0;margin:0 0 15px;font-size:14px;">
                            <strong style="color:#fff;">Nome:</strong> ${nome}
                        </p>
                        <p style="color:#a0a0a0;margin:0 0 15px;font-size:14px;">
                            <strong style="color:#fff;">Email:</strong> ${email}
                        </p>
                        ${telefone ? `
                        <p style="color:#a0a0a0;margin:0 0 15px;font-size:14px;">
                            <strong style="color:#fff;">Telefone:</strong> ${telefone}
                        </p>
                        ` : ''}
                        ${assunto ? `
                        <p style="color:#a0a0a0;margin:0 0 15px;font-size:14px;">
                            <strong style="color:#fff;">Assunto:</strong> ${assunto}
                        </p>
                        ` : ''}
                        <div style="background:#1a1a1a;padding:15px;border-radius:6px;border-left:3px solid #D32F2F;margin-top:15px;">
                            <p style="color:#fff;margin:0 0 10px;font-size:13px;"><strong>Mensagem:</strong></p>
                            <p style="color:#d0d0d0;margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${mensagem}</p>
                        </div>
                    </div>
                </div>
            `,
        })

        // Email de confirmação para o cliente
        await resend.emails.send({
            from: 'NenemPneus.com <contato@nenempneus.com>',
            replyTo: 'contato@nenempneus.com',
            to: [email],
            subject: 'Recebemos sua mensagem - NenemPneus.com',
            text: `Olá ${nome},

Recebemos sua mensagem e ela é muito importante para nós.
Responderemos em até 24 horas úteis.

Enquanto isso, explore nosso catálogo com até 50% de desconto!
https://nenempneus.com/catalogo

Precisa de resposta rápida? Fale conosco pelo WhatsApp:
https://wa.me/5548999496450

--
NenemPneus.com
HANDERSON FRANCISCO LTDA
CNPJ: 36.985.207/0001-00
Av. Nereu Ramos, 740, Sala 01
Capivari de Baixo - SC
`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a1a;padding:20px;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td style="background:#D32F2F;padding:25px;text-align:center;border-radius:8px 8px 0 0;">
                                <img src="https://nenempneus.com/logoT.png" alt="NenemPneus.com" width="160" style="max-width:160px;">
                            </td>
                        </tr>
                        <tr>
                            <td style="background:#242424;padding:30px;border-radius:0 0 8px 8px;">
                                <h1 style="margin:0 0 15px;font-size:24px;text-align:center;color:#fff;">
                                    Mensagem <span style="color:#D32F2F;">Recebida!</span>
                                </h1>
                                <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a0a0a0;text-align:center;">
                                    Obrigado por entrar em contato conosco.
                                </p>
                                <div style="background:#1a1a1a;padding:20px;border-radius:6px;border-left:3px solid #D32F2F;">
                                    <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#d0d0d0;">
                                        Olá <strong style="color:#fff;">${nome}</strong>,
                                    </p>
                                    <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#d0d0d0;">
                                        Recebemos sua mensagem e ela é <strong style="color:#fff;">muito importante para nós</strong>.
                                    </p>
                                    <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#d0d0d0;">
                                        Responderemos em até <strong style="color:#D32F2F;">24 horas úteis</strong>.
                                    </p>
                                    <p style="margin:0;font-size:14px;line-height:1.7;color:#d0d0d0;">
                                        Enquanto isso, explore nosso catálogo com <strong style="color:#fff;">até 50% de desconto</strong>!
                                    </p>
                                </div>
                                <div style="margin-top:20px;background:#2a2a2a;border-radius:6px;padding:15px;text-align:center;">
                                    <p style="margin:0 0 10px;font-size:13px;color:#a0a0a0;">
                                        Precisa de resposta rápida?
                                    </p>
                                    <a href="https://wa.me/5548999496450" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:10px 25px;border-radius:20px;font-size:13px;font-weight:bold;">
                                        WhatsApp
                                    </a>
                                </div>
                                <div style="margin-top:20px;text-align:center;">
                                    <a href="https://nenempneus.com/catalogo" style="display:inline-block;background:#D32F2F;color:#fff;text-decoration:none;padding:12px 30px;border-radius:6px;font-size:14px;font-weight:bold;">
                                        VER CATÁLOGO
                                    </a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:20px;text-align:center;">
                                <p style="margin:0 0 5px;font-size:11px;color:#606060;">
                                    HANDERSON FRANCISCO LTDA | CNPJ: 36.985.207/0001-00
                                </p>
                                <p style="margin:0;font-size:10px;color:#404040;">
                                    © 2025 NenemPneus.com
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>
            `,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao enviar email:', error)
        return NextResponse.json(
            { error: 'Erro ao enviar mensagem. Tente novamente.' },
            { status: 500 }
        )
    }
}
