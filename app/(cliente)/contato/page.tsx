'use client'

import { Mail, MapPin, Send, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { LOJA_INFO } from '@/lib/constants'

const contatoInfo = [
    {
        icon: MessageSquare,
        title: 'WhatsApp',
        value: LOJA_INFO.telefone,
        description: 'Atendimento rápido',
        href: `https://wa.me/${LOJA_INFO.whatsapp}?text=${encodeURIComponent('Olá! Vim do site e gostaria de saber mais sobre os pneus.')}`,
        highlight: true
    },
    {
        icon: MapPin,
        title: 'Endereço',
        value: `${LOJA_INFO.endereco}, ${LOJA_INFO.bairro}`,
        description: `${LOJA_INFO.cidade}/${LOJA_INFO.estado} - CEP: ${LOJA_INFO.cep}`
    },
    {
        icon: Mail,
        title: 'E-mail',
        value: LOJA_INFO.email,
        description: 'Para assuntos formais'
    }
]

export default function ContatoPage() {
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
                        Entre em <span className="text-primary">Contato</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Estamos prontos para ajudar você a encontrar o pneu ideal. Fale conosco!
                    </p>
                </div>
            </section>

            {/* Informações de Contato */}
            <section className="container mx-auto px-4 py-16 -mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {contatoInfo.map((item, index) => {
                        const Icon = item.icon
                        const content = (
                            <CardContent className="p-6 text-center">
                                <div className={`mb-4 inline-flex p-4 rounded-full transition-all duration-300 ${item.highlight
                                    ? 'bg-green-500/20 group-hover:bg-green-500/30 group-hover:scale-110'
                                    : 'bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110'
                                    }`}>
                                    <Icon className={`h-6 w-6 ${item.highlight ? 'text-green-600' : 'text-primary'}`} />
                                </div>
                                <h3 className={`font-semibold text-lg mb-1 transition-colors ${item.highlight
                                    ? 'text-green-600 group-hover:text-green-500'
                                    : 'group-hover:text-primary'
                                    }`}>
                                    {item.title}
                                </h3>
                                <p className="text-sm font-medium text-foreground mb-1">
                                    {item.value}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {item.description}
                                </p>
                            </CardContent>
                        )

                        return (
                            <Card
                                key={index}
                                className={`group transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${item.highlight
                                    ? 'border-green-500/50 hover:border-green-500 hover:shadow-green-500/20'
                                    : 'hover:border-primary/50 hover:shadow-primary/10'
                                    } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                                style={{
                                    transitionDelay: isVisible ? `${200 + index * 100}ms` : '0ms'
                                }}
                            >
                                {item.href ? (
                                    <Link href={item.href} target="_blank">
                                        {content}
                                    </Link>
                                ) : (
                                    content
                                )}
                            </Card>
                        )
                    })}
                </div>
            </section>

            {/* Formulário de Contato */}
            <section className="container mx-auto px-4 py-16">
                <div className="max-w-2xl mx-auto">
                    <div className={`transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}>
                        <Card className="border-primary/20">
                            <CardContent className="p-8">
                                <h2 className="text-3xl font-bold mb-2 text-center">Envie uma Mensagem</h2>
                                <p className="text-muted-foreground text-center mb-8">
                                    Preencha o formulário abaixo e entraremos em contato em breve
                                </p>

                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nome">Nome *</Label>
                                            <Input
                                                id="nome"
                                                placeholder="Seu nome completo"
                                                className="transition-all duration-300 focus:scale-[1.02]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="telefone">Telefone *</Label>
                                            <Input
                                                id="telefone"
                                                type="tel"
                                                placeholder="(48) 9XXXX-XXXX"
                                                className="transition-all duration-300 focus:scale-[1.02]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">E-mail *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            className="transition-all duration-300 focus:scale-[1.02]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="assunto">Assunto</Label>
                                        <Input
                                            id="assunto"
                                            placeholder="Sobre o que deseja falar?"
                                            className="transition-all duration-300 focus:scale-[1.02]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="mensagem">Mensagem *</Label>
                                        <Textarea
                                            id="mensagem"
                                            placeholder="Digite sua mensagem aqui..."
                                            rows={5}
                                            className="transition-all duration-300 focus:scale-[1.02] resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full group relative overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50"
                                    >
                                        <Send className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                                        <span className="relative z-10">Enviar Mensagem</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA WhatsApp */}
            <section className="relative bg-gradient-to-br from-primary/90 to-primary text-primary-foreground py-16 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl" />
                </div>

                <div className="relative container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Prefere falar no WhatsApp?
                    </h2>
                    <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                        Atendimento rápido e direto pelo seu aplicativo favorito
                    </p>
                    <Button
                        size="lg"
                        variant="secondary"
                        asChild
                        className="hover:scale-105 transition-all hover:shadow-xl"
                    >
                        <Link href={`https://wa.me/${LOJA_INFO.whatsapp}`} target="_blank">
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Falar no WhatsApp
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    )
}
