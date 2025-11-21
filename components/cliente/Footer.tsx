import Link from 'next/link'
import { Facebook, Instagram, MapPin, Phone, Mail } from 'lucide-react'
import { LOJA_INFO } from '@/lib/constants'

export function Footer() {
    return (
        <footer className="bg-secondary text-secondary-foreground mt-auto">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sobre */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Neném Pneus</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Pneus seminovos de qualidade com até 50% de desconto.
                            Garantia e segurança para você e sua família.
                        </p>
                        <div className="flex gap-4">
                            <Link
                                href="https://facebook.com"
                                target="_blank"
                                className="hover:text-primary transition-colors"
                            >
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link
                                href="https://instagram.com"
                                target="_blank"
                                className="hover:text-primary transition-colors"
                            >
                                <Instagram className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Links Úteis</h3>
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
                        </ul>
                    </div>

                    {/* Contato */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Contato</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <span>
                                    {LOJA_INFO.endereco}<br />
                                    {LOJA_INFO.cidade} - {LOJA_INFO.estado}<br />
                                    CEP: {LOJA_INFO.cep}
                                </span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="h-5 w-5 text-primary" />
                                <span>{LOJA_INFO.telefone}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-primary" />
                                <span>{LOJA_INFO.email}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-border">
                <div className="container mx-auto px-4 py-4">
                    <p className="text-sm text-center text-muted-foreground">
                        © {new Date().getFullYear()} Neném Pneus. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </footer>
    )
}
