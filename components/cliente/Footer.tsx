import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, MapPin, MessageCircle, Mail, Lock } from 'lucide-react'
import { LOJA_INFO, LOJA_NOME_COMPLETO } from '@/lib/constants'

export function Footer() {
    return (
        <footer className="bg-secondary text-secondary-foreground mt-auto bg-metallic-gradient">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sobre */}
                    <div>
                        <Link href="/" className="inline-block mb-4">
                            <Image
                                src="/logoT.png"
                                alt="NenemPneus.com"
                                width={150}
                                height={50}
                                className="h-10 w-auto"
                            />
                        </Link>
                        <p className="text-sm text-muted-foreground mb-4">
                            Pneus seminovos de qualidade com até 50% de desconto.
                            Garantia e segurança para você e sua família.
                        </p>
                        <div className="flex gap-4">
                            <Link
                                href="https://www.facebook.com/share/17krnjq8AE/?mibextid=wwXIfr"
                                target="_blank"
                                className="hover:text-primary transition-colors"
                            >
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link
                                href="https://www.instagram.com/nenem.pneus?igsh=cm4zb3FzemJrbnZk&utm_source=qr"
                                target="_blank"
                                className="hover:text-primary transition-colors"
                            >
                                <Instagram className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 line-accent">Links Úteis</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="hover:text-primary transition-colors">
                                    Início
                                </Link>
                            </li>
                            <li>
                                <Link href="/catalogo" className="hover:text-primary transition-colors">
                                    Catálogo
                                </Link>
                            </li>
                            <li>
                                <Link href="/sobre" className="hover:text-primary transition-colors">
                                    Sobre Nós
                                </Link>
                            </li>
                            <li>
                                <Link href="/contato" className="hover:text-primary transition-colors">
                                    Contato
                                </Link>
                            </li>
                            <li>
                                <Link href="/garantia" className="hover:text-primary transition-colors">
                                    Garantia
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contato */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 line-accent">Contato</h3>
                        <ul className="space-y-3 text-sm">
                            {/* WhatsApp - Principal */}
                            <li>
                                <Link
                                    href={`https://wa.me/${LOJA_INFO.whatsapp}?text=${encodeURIComponent('Olá! Vim do site e gostaria de saber mais sobre os pneus.')}`}
                                    target="_blank"
                                    className="flex items-center gap-2 text-green-600 hover:text-green-500 font-medium transition-colors"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                    <span>{LOJA_INFO.whatsappDisplay}</span>
                                </Link>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <span>
                                    {LOJA_INFO.endereco}<br />
                                    {LOJA_INFO.cidade} - {LOJA_INFO.estado}<br />
                                    CEP: {LOJA_INFO.cep}
                                </span>
                            </li>
                            <li className="flex items-center gap-2 text-muted-foreground/70">
                                <Mail className="h-5 w-5" />
                                <span className="text-xs">{LOJA_INFO.email}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-border">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors"
                            title="Área restrita"
                        >
                            <Lock className="h-3 w-3" />
                        </Link>
                        <div className="text-center md:text-left">
                            <p className="text-sm text-muted-foreground">
                                © {new Date().getFullYear()} {LOJA_INFO.razaoSocial}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                                CNPJ: {LOJA_INFO.cnpj}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
