import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function Hero() {
    return (
        <section className="bg-gradient-to-b from-primary/10 to-background">
            <div className="container mx-auto px-4 py-20">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                        Pneus Seminovos de Qualidade
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8">
                        Economize até 50% com pneus recauchutados e seminovos.
                        Garantia, segurança e qualidade para você e sua família.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" asChild>
                            <Link href="/catalogo">
                                Ver Catálogo
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
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
