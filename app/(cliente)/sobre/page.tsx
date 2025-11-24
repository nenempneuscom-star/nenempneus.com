'use client'

import { Metadata } from 'next'
import { Shield, Award, TrendingDown, Users, MapPin, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

const diferenciais = [
    {
        icon: Shield,
        title: 'Pneus Inspecionados',
        description: 'Rigorosa inspeção de qualidade em cada pneu'
    },
    {
        icon: Award,
        title: 'Garantia Total',
        description: 'Garantia em todos os produtos vendidos'
    },
    {
        icon: TrendingDown,
        title: 'Melhor Custo-Benefício',
        description: 'Preços imbatíveis sem comprometer qualidade'
    },
    {
        icon: Users,
        title: 'Atendimento Especializado',
        description: 'Equipe treinada e pronta para ajudar'
    }
]

export default function SobrePage() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
    }, [])

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-20 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-10 right-10 w-64 h-64 bg-primary rounded-full blur-3xl animate-blob" />
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/50 rounded-full blur-3xl animate-blob animation-delay-2000" />
                </div>

                <div className={`relative container mx-auto px-4 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Sobre a <span className="text-primary">Neném Pneus</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Há mais de 20 anos no mercado, somos referência em pneus seminovos inspecionados em Capivari de Baixo e região
                    </p>
                </div>
            </section>

            {/* Nossa História */}
            <section className="container mx-auto px-4 py-20">
                <div className={`max-w-4xl mx-auto transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <Card className="border-primary/20">
                        <CardContent className="p-8 md:p-12">
                            <h2 className="text-3xl font-bold mb-6 text-center">Nossa Missão</h2>
                            <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                                Nossa missão é oferecer <span className="text-primary font-semibold">segurança e economia</span> para você e sua família, com produtos de alta qualidade e um atendimento especializado.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Cada pneu que vendemos passa por uma <span className="text-primary font-semibold">inspeção rigorosa</span>, garantindo que você tenha tranquilidade nas estradas.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Diferenciais */}
            <section className="bg-muted/30 py-20">
                <div className="container mx-auto px-4">
                    <div className={`text-center mb-12 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Nossos <span className="text-primary">Diferenciais</span>
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            O que nos torna a escolha certa para seus pneus
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {diferenciais.map((item, index) => {
                            const Icon = item.icon
                            return (
                                <Card
                                    key={index}
                                    className={`group hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                        }`}
                                    style={{
                                        transitionDelay: isVisible ? `${400 + index * 100}ms` : '0ms'
                                    }}
                                >
                                    <CardContent className="p-6 text-center">
                                        <div className="mb-4 inline-flex p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                                            <Icon className="h-8 w-8 text-primary" />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Localização */}
            <section className="container mx-auto px-4 py-20">
                <div className={`max-w-4xl mx-auto transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <Card className="border-primary/20 overflow-hidden">
                        <CardContent className="p-8 md:p-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-lg bg-primary/10">
                                    <MapPin className="h-6 w-6 text-primary" />
                                </div>
                                <h2 className="text-3xl font-bold">Nossa Localização</h2>
                            </div>
                            <p className="text-lg text-muted-foreground mb-6">
                                Rua Principal, 123 - Centro<br />
                                Capivari de Baixo/SC
                            </p>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Clock className="h-5 w-5 text-primary" />
                                <p>Venha nos fazer uma visita e encontre o pneu ideal para seu veículo!</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    )
}
