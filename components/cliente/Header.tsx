import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle } from 'lucide-react'
import { LOJA_INFO, LOJA_NOME_DISPLAY, NAVEGACAO } from '@/lib/constants'
import { CarrinhoSheet } from './CarrinhoSheet'

export function Header() {
    return (
        <header className="border-b">
            {/* Top bar */}
            <div className="bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`https://wa.me/${LOJA_INFO.whatsapp}`}
                            target="_blank"
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                            <MessageCircle className="h-4 w-4" />
                            {LOJA_INFO.whatsappDisplay}
                        </Link>
                        <span>{LOJA_INFO.email}</span>
                    </div>
                    <div>
                        <span>{LOJA_INFO.endereco} - {LOJA_INFO.cidade}/{LOJA_INFO.estado}</span>
                    </div>
                </div>
            </div>

            {/* Main header */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/logoT.png"
                            alt="NenemPneus.com"
                            width={180}
                            height={60}
                            className="h-12 w-auto"
                            priority
                        />
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {NAVEGACAO.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-sm font-medium hover:text-primary transition-colors"
                            >
                                {item.nome}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <CarrinhoSheet />
                    </div>
                </div>
            </div>
        </header>
    )
}
