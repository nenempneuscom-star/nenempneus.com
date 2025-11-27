'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BuscaMedidas } from './BuscaMedidas'

export function Hero() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
    }, [])

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
            {/* Animated background gradient */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-xl animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-primary/50 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
            </div>

            <div className="relative container mx-auto px-4 py-24 md:py-32">
                <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight title-logo-style">
                        <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-primary/60 animate-gradient">
                            Pneus Seminovos
                        </span>
                        <br />
                        <span className="text-metallic">de Qualidade</span>
                    </h1>

                    <p className={`text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}>
                        Economize <span className="text-primary font-semibold">até 50%</span> com pneus seminovos inspecionados.
                        <br className="hidden md:block" />
                        Garantia, segurança e qualidade para você e sua família.
                    </p>

                    {/* Busca por medidas */}
                    <div className={`mb-10 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}>
                        <BuscaMedidas />
                    </div>

                    <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}>
                        <Button
                            size="lg"
                            asChild
                            className="group relative overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50"
                        >
                            <Link href="/catalogo">
                                <span className="relative z-10">Ver Catálogo</span>
                                <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            asChild
                            className="hover:scale-105 hover:bg-primary/10 hover:border-primary transition-all duration-300 metallic-shine"
                        >
                            <Link href="/contato">
                                Fale Conosco
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}
