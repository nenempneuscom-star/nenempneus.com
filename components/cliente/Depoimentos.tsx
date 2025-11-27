'use client'

import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useState } from 'react'

const depoimentos = [
    {
        id: 1,
        nome: 'João Silva',
        cidade: 'Tubarão/SC',
        texto: 'Comprei 4 pneus seminovos e economizei mais de R$ 1.000. Qualidade excelente, sulco perfeito! Recomendo demais.',
        nota: 5,
        inicial: 'J',
    },
    {
        id: 2,
        nome: 'Maria Santos',
        cidade: 'Capivari de Baixo/SC',
        texto: 'Atendimento impecável e pneus de primeira qualidade. Já é a segunda vez que compro e sempre volto!',
        nota: 5,
        inicial: 'M',
    },
    {
        id: 3,
        nome: 'Carlos Oliveira',
        cidade: 'Braço do Norte/SC',
        texto: 'Muito bom! Os pneus vieram com sulco bem preservado e o preço foi imbatível. Instalação rápida e profissional.',
        nota: 5,
        inicial: 'C',
    },
    {
        id: 4,
        nome: 'Ana Paula',
        cidade: 'Laguna/SC',
        texto: 'Sempre tive receio de comprar pneu usado, mas a inspeção que fazem é muito rigorosa. Estou super satisfeita!',
        nota: 5,
        inicial: 'A',
    },
    {
        id: 5,
        nome: 'Roberto Costa',
        cidade: 'Imbituba/SC',
        texto: 'Preço justo, pneus de qualidade e garantia! Não tem como errar. Já indiquei para vários amigos.',
        nota: 5,
        inicial: 'R',
    },
    {
        id: 6,
        nome: 'Fernanda Lima',
        cidade: 'Tubarão/SC',
        texto: 'Excelente custo-benefício! Economizei bastante e os pneus estão perfeitos. Atendimento nota 10.',
        nota: 5,
        inicial: 'F',
    },
]

export default function Depoimentos() {
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

        const section = document.getElementById('depoimentos-section')
        if (section) observer.observe(section)

        return () => {
            if (section) observer.unobserve(section)
        }
    }, [])

    return (
        <section id="depoimentos-section" className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        O que dizem <span className="text-primary">nossos clientes</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Milhares de clientes satisfeitos em Capivari de Baixo e região
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {depoimentos.map((depoimento, index) => (
                        <Card
                            key={depoimento.id}
                            className={`transition-all duration-700 delay-${index * 100} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                }`}
                        >
                            <CardContent className="p-6">
                                {/* Quote icon */}
                                <Quote className="h-8 w-8 text-primary/20 mb-4" />

                                {/* Estrelas */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(depoimento.nota)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className="h-5 w-5 fill-yellow-400 text-yellow-400"
                                        />
                                    ))}
                                </div>

                                {/* Texto */}
                                <p className="text-muted-foreground mb-6 italic">
                                    "{depoimento.texto}"
                                </p>

                                {/* Autor */}
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-lg font-bold text-primary">
                                            {depoimento.inicial}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold">{depoimento.nome}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {depoimento.cidade}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Estatística adicional */}
                <div className={`text-center mt-12 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-full">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-lg">4.9/5.0</span>
                        <span className="text-muted-foreground">• 300+ clientes atendidos</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
