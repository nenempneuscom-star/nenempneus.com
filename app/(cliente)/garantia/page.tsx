'use client'

import { Shield, CheckCircle, XCircle, Phone, Clock, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function GarantiaPage() {
    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative bg-gradient-to-br from-primary/90 to-primary text-primary-foreground py-20 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl animate-blob" />
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl animate-blob animation-delay-2000" />
                </div>

                <div className="relative container mx-auto px-4 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
                        <Shield className="h-10 w-10" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Nossa Garantia
                    </h1>
                    <p className="text-xl opacity-90 max-w-3xl mx-auto">
                        Transparência e segurança em todos os pneus que vendemos
                    </p>
                </div>
            </section>

            {/* Conteúdo Principal */}
            <section className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Resumo da Garantia */}
                    <Card className="border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Shield className="h-6 w-6 text-primary" />
                                Garantia de 90 Dias
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-lg">
                                Todos os pneus seminovos vendidos pela <span className="font-semibold text-primary">NenemPneus.com</span> contam com garantia de <span className="font-bold">90 dias</span> contra defeitos estruturais ocultos.
                            </p>
                            <p className="text-muted-foreground">
                                Nossa garantia demonstra a confiança que temos na qualidade dos pneus que comercializamos. Cada pneu passa por inspeção rigorosa antes de ser aprovado para venda.
                            </p>
                        </CardContent>
                    </Card>

                    {/* O que a garantia cobre */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                O que a Garantia Cobre
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Defeitos estruturais ocultos</p>
                                        <p className="text-sm text-muted-foreground">Problemas internos na estrutura do pneu não detectáveis visualmente na inspeção inicial</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Deformações na banda de rodagem</p>
                                        <p className="text-sm text-muted-foreground">Ondulações ou irregularidades que surgirem após a compra</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Vazamentos sem causa aparente</p>
                                        <p className="text-sm text-muted-foreground">Perda de ar não causada por furos externos ou danos visíveis</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Problemas na banda lateral</p>
                                        <p className="text-sm text-muted-foreground">Rachaduras ou bolhas que comprometam a segurança</p>
                                    </div>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* O que NÃO está coberto */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                                O que NÃO está Coberto pela Garantia
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Desgaste natural do pneu</p>
                                        <p className="text-sm text-muted-foreground">Redução gradual do sulco devido ao uso normal</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Furos causados por objetos externos</p>
                                        <p className="text-sm text-muted-foreground">Pregos, parafusos, vidros ou qualquer objeto perfurante</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Danos por uso indevido</p>
                                        <p className="text-sm text-muted-foreground">Sobrecarga, pressão incorreta, alinhamento/balanceamento inadequado</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Acidentes ou colisões</p>
                                        <p className="text-sm text-muted-foreground">Danos causados por impactos, batidas em meio-fio, buracos, etc.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Pneus sem nota fiscal</p>
                                        <p className="text-sm text-muted-foreground">A nota fiscal é obrigatória para acionar a garantia</p>
                                    </div>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Como acionar a garantia */}
                    <Card className="border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Phone className="h-5 w-5 text-primary" />
                                Como Acionar a Garantia
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="font-bold text-primary">1</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Entre em contato conosco</p>
                                        <p className="text-sm text-muted-foreground">WhatsApp, telefone ou venha até nossa loja</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="font-bold text-primary">2</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Tenha em mãos sua nota fiscal</p>
                                        <p className="text-sm text-muted-foreground">A nota fiscal é essencial para comprovar a compra</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="font-bold text-primary">3</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Nossa equipe avaliará o pneu</p>
                                        <p className="text-sm text-muted-foreground">Verificaremos se o problema está coberto pela garantia</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="font-bold text-primary">4</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Substituição ou reparo</p>
                                        <p className="text-sm text-muted-foreground">Se aprovado, faremos a troca ou reparo sem custos adicionais</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg mt-6">
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Prazo de Análise</p>
                                        <p className="text-sm text-muted-foreground">
                                            A avaliação é feita em até 24 horas úteis após o recebimento do pneu. Em casos claros de defeito coberto, a substituição é imediata.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informações Importantes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Informações Importantes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                • A garantia é válida a partir da data de emissão da nota fiscal
                            </p>
                            <p className="text-sm text-muted-foreground">
                                • Recomendamos verificar a calibragem semanalmente para manter a vida útil do pneu
                            </p>
                            <p className="text-sm text-muted-foreground">
                                • Faça alinhamento e balanceamento regularmente
                            </p>
                            <p className="text-sm text-muted-foreground">
                                • Guarde a nota fiscal em local seguro durante todo o período de garantia
                            </p>
                            <p className="text-sm text-muted-foreground">
                                • Em caso de dúvidas, nossa equipe está sempre disponível para ajudar
                            </p>
                        </CardContent>
                    </Card>

                    {/* CTA */}
                    <div className="text-center pt-8">
                        <p className="text-lg mb-6">
                            Tem alguma dúvida sobre nossa garantia?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild>
                                <Link href="/contato">Fale Conosco</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link href="/catalogo">Ver Catálogo</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
