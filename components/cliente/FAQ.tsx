'use client'

import { HelpCircle, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'

const perguntas = [
    {
        id: '1',
        pergunta: 'Pneu seminovo é seguro?',
        resposta: 'Sim! Todos os nossos pneus passam por inspeção rigorosa antes da venda. Só aprovamos pneus com sulco acima de 5mm (o mínimo legal é 1,6mm), banda lateral sem rachaduras ou deformações, e estrutura 100% intacta. Além disso, oferecemos garantia de 90 dias contra defeitos estruturais.',
    },
    {
        id: '2',
        pergunta: 'Como vocês medem e inspecionam os pneus?',
        resposta: 'Utilizamos medidor profissional de sulco e realizamos inspeção visual e tátil completa. Verificamos: profundidade do sulco em múltiplos pontos, estado da banda lateral (sem rachaduras ou bolhas), data de fabricação (não vendemos pneus com mais de 5 anos), deformações na estrutura, e presença de reparos anteriores. Só aprovamos pneus em excelente estado.',
    },
    {
        id: '3',
        pergunta: 'Tem garantia? Qual o prazo e o que cobre?',
        resposta: 'Sim! Oferecemos garantia de 90 dias contra defeitos estruturais ocultos, como deformações internas, vazamentos sem causa aparente, e problemas na banda lateral. A garantia NÃO cobre desgaste natural, furos causados por objetos externos, ou danos por uso indevido. Veja todos os detalhes na nossa página de garantia.',
    },
    {
        id: '4',
        pergunta: 'Quanto tempo dura um pneu seminovo?',
        resposta: 'Depende do sulco e do uso. Um pneu com sulco de 7mm (como muitos dos nossos) pode durar de 2 a 3 anos em uso moderado urbano. Pneus com sulco de 5-6mm duram de 1 a 2 anos. Para maximizar a vida útil, recomendamos: calibragem correta semanal, alinhamento e balanceamento a cada 10.000km, e rodízio dos pneus regularmente.',
    },
    {
        id: '5',
        pergunta: 'Posso trocar se o pneu não servir no meu carro?',
        resposta: 'Sim! Se você escolher a medida errada ou o pneu não for compatível com seu veículo, aceitamos troca em até 7 dias, desde que o pneu não tenha sido instalado ou usado. Recomendamos verificar o manual do seu veículo ou falar conosco ANTES da compra para garantir a medida correta.',
    },
    {
        id: '6',
        pergunta: 'Vocês fazem instalação? Quanto custa?',
        resposta: 'Sim! Fazemos instalação completa na nossa loja em Capivari de Baixo. O serviço de montagem é GRATUITO na compra de 4 pneus. Para compras menores, cobramos R$ 15 por pneu. Também oferecemos balanceamento (R$ 15/roda) e geometria (a partir de R$ 80) como serviços opcionais.',
    },
    {
        id: '7',
        pergunta: 'Quais formas de pagamento vocês aceitam?',
        resposta: 'Aceitamos: PIX (com desconto), Cartão de Crédito em até 12x sem juros via Mercado Pago, Cartão de Débito, e Dinheiro (na loja). Para pagamentos online, você finaliza pelo Mercado Pago com total segurança.',
    },
    {
        id: '8',
        pergunta: 'Vocês entregam? Como funciona?',
        resposta: 'Sim, fazemos entrega na região de Capivari de Baixo, Tubarão, Braço do Norte, Laguna e Imbituba. O frete varia conforme a distância. Você também pode retirar gratuitamente na nossa loja mediante agendamento. O agendamento é feito durante o checkout.',
    },
    {
        id: '9',
        pergunta: 'Como funciona o agendamento de instalação?',
        resposta: 'Durante o checkout, você escolhe a data e horário preferido para instalação. Após a confirmação do pagamento, nossa equipe entra em contato via WhatsApp em até 2 horas para confirmar o horário. No dia marcado, basta chegar na loja com seu veículo. O serviço leva cerca de 30-40 minutos para 4 pneus.',
    },
    {
        id: '10',
        pergunta: 'Qual a diferença entre pneu "seminovo" e "remold"?',
        resposta: 'São totalmente diferentes! Pneu SEMINOVO é um pneu original usado em bom estado, que passou por inspeção e ainda tem muito sulco. Pneu REMOLD é um pneu velho que teve a banda de rodagem substituída (recauchutagem). Nós vendemos APENAS pneus seminovos originais, nunca remold ou recauchutado. Mais segurança e qualidade garantida!',
    },
]

export default function FAQ() {
    const [openItem, setOpenItem] = useState<string | undefined>()

    return (
        <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                        <HelpCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Perguntas <span className="text-primary">Frequentes</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Tire suas dúvidas sobre nossos pneus seminovos, garantia, e serviços
                    </p>
                </div>

                <div className="max-w-3xl mx-auto">
                    <Accordion
                        type="single"
                        collapsible
                        value={openItem}
                        onValueChange={setOpenItem}
                        className="space-y-4"
                    >
                        {perguntas.map((item) => (
                            <AccordionItem
                                key={item.id}
                                value={item.id}
                                className="border rounded-lg px-6 bg-card hover:shadow-md transition-shadow"
                            >
                                <AccordionTrigger className="text-left hover:no-underline py-5">
                                    <span className="font-semibold pr-4">{item.pergunta}</span>
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground pb-5">
                                    {item.resposta}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    {/* CTA adicional */}
                    <div className="text-center mt-12 p-8 bg-muted/50 rounded-lg">
                        <p className="text-lg mb-4">Ainda tem dúvidas?</p>
                        <p className="text-muted-foreground mb-6">
                            Nossa equipe está pronta para ajudar! Entre em contato via WhatsApp, telefone ou e-mail.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a
                                href="https://wa.me/5548999999999?text=Olá! Tenho uma dúvida sobre os pneus"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                            >
                                WhatsApp
                            </a>
                            <a
                                href="/contato"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                            >
                                Outras Formas de Contato
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
