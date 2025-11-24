'use client'

import { Shield, TrendingDown, Search, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'

const features = [
    {
        icon: Shield,
        title: 'Garantia de Qualidade',
        description: 'Todos os pneus passam por inspeção rigorosa antes da venda'
    },
    {
        icon: TrendingDown,
        title: 'Economia de até 50%',
        description: 'Preços imbatíveis sem comprometer a segurança'
    },
    {
        icon: Search,
        title: 'Inspeção Rigorosa',
        description: 'Verificação detalhada de sulco, banda e estrutura'
    },
    {
        icon: Wrench,
        title: 'Instalação na Loja',
        description: 'Compre online e instale diretamente em nossa loja'
    }
]

export function Features() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.1 }
        )

        const element = document.getElementById('features-section')
        if (element) observer.observe(element)

        return () => {
            if (element) observer.unobserve(element)
        }
    }, [])

    return (
        <section id="features-section" className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Por que escolher a <span className="text-primary">Neném Pneus</span>?
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Comprometidos com qualidade, segurança e o melhor atendimento para você
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <div
                                key={index}
                                className={`group p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                    }`}
                                style={{
                                    transitionDelay: isVisible ? `${index * 150}ms` : '0ms'
                                }}
                            >
                                <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                                    <Icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
