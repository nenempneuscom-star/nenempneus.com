'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    useCarrinhoStore,
    type GeometriaConfig,
    type BalanceamentoConfig,
    gerarDescricaoGeometria,
    gerarDescricaoBalanceamento,
} from '@/lib/store/carrinho-store'
import { formatPrice } from '@/lib/utils'
import {
    User,
    MapPin,
    Car,
    Calendar,
    Clock,
    ShoppingBag,
    Wrench,
    Edit2,
    CheckCircle2,
    Shield,
    CreditCard,
    ArrowLeft,
    Loader2,
    AlertCircle,
    Package,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Image from 'next/image'

interface DadosCliente {
    nome: string
    email: string
    telefone: string
    cpf?: string
    cep: string
    endereco: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
    veiculoMarca?: string
    veiculoModelo?: string
    veiculoAno?: string
    veiculoPlaca?: string
    observacoes?: string
}

interface Agendamento {
    data: string
    hora: string
}

interface RevisaoPedidoProps {
    dados: DadosCliente
    agendamento: Agendamento
    onVoltar: () => void
    onEditarDados: () => void
    onEditarAgendamento: () => void
    onConfirmar: () => void
    loading: boolean
}

export function RevisaoPedido({
    dados,
    agendamento,
    onVoltar,
    onEditarDados,
    onEditarAgendamento,
    onConfirmar,
    loading
}: RevisaoPedidoProps) {
    const { items, servicos, getSubtotal, getTotalItems, getTotalServicos, getTotal } = useCarrinhoStore()

    const subtotal = getSubtotal()
    const totalItems = getTotalItems()
    const totalServicos = getTotalServicos()
    const total = getTotal()

    // Formatar data do agendamento
    const dataFormatada = agendamento?.data
        ? format(new Date(agendamento.data + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })
        : ''

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onVoltar}
                    className="shrink-0"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Revise seu Pedido</h1>
                    <p className="text-muted-foreground mt-1">
                        Confira todos os detalhes antes de finalizar
                    </p>
                </div>
            </div>

            {/* Alerta de Revisão */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-amber-900">Verifique as informações</p>
                    <p className="text-sm text-amber-700">
                        Confira se todos os dados estão corretos. Você pode editar qualquer seção clicando no botão "Editar".
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Itens do Pedido */}
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <ShoppingBag className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Itens do Pedido</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {totalItems} {totalItems === 1 ? 'pneu' : 'pneus'}
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <a href="/carrinho">
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Editar
                                </a>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {items.map((item) => (
                                    <div key={item.id} className="p-4 flex gap-4">
                                        <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden shrink-0">
                                            {item.imagemUrl ? (
                                                <Image
                                                    src={item.imagemUrl}
                                                    alt={item.nome}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium truncate">{item.nome}</h4>
                                            {item.specs && (
                                                <p className="text-sm text-muted-foreground">
                                                    {item.specs.largura}/{item.specs.perfil}R{item.specs.aro}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm text-muted-foreground">
                                                    Qtd: {item.quantidade}
                                                </span>
                                                <span className="font-semibold text-primary">
                                                    {formatPrice(item.preco * item.quantidade)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Serviços */}
                            {servicos.length > 0 && (
                                <div className="border-t bg-muted/30">
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Wrench className="h-4 w-4 text-primary" />
                                            Serviços Inclusos
                                        </div>
                                        {servicos.map((servico) => {
                                            const descricao = servico.id === 'geometria'
                                                ? gerarDescricaoGeometria(servico.config as GeometriaConfig)
                                                : gerarDescricaoBalanceamento(servico.config as BalanceamentoConfig)

                                            return (
                                                <div key={servico.id} className="flex justify-between text-sm">
                                                    <span>{descricao}</span>
                                                    <span className="font-medium">{formatPrice(servico.preco)}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Agendamento */}
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Calendar className="h-5 w-5 text-green-600" />
                                </div>
                                <CardTitle className="text-lg">Agendamento</CardTitle>
                            </div>
                            <Button variant="outline" size="sm" onClick={onEditarAgendamento}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Alterar
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Data</p>
                                        <p className="font-medium capitalize">{dataFormatada}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Horário</p>
                                        <p className="font-medium">{agendamento?.hora}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium">Local da Instalação</p>
                                        <p className="text-muted-foreground">
                                            Av. Nereu Ramos, 740, Sala 01 - Capivari de Baixo, SC
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dados Pessoais */}
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <CardTitle className="text-lg">Dados Pessoais</CardTitle>
                            </div>
                            <Button variant="outline" size="sm" onClick={onEditarDados}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Editar
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Nome</p>
                                    <p className="font-medium">{dados.nome}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{dados.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Telefone</p>
                                    <p className="font-medium">{dados.telefone}</p>
                                </div>
                                {dados.cpf && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">CPF</p>
                                        <p className="font-medium">{dados.cpf}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Endereço */}
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <MapPin className="h-5 w-5 text-purple-600" />
                                </div>
                                <CardTitle className="text-lg">Endereço de Cadastro</CardTitle>
                            </div>
                            <Button variant="outline" size="sm" onClick={onEditarDados}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Editar
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="font-medium">
                                {dados.endereco}, {dados.numero}
                                {dados.complemento && ` - ${dados.complemento}`}
                            </p>
                            <p className="text-muted-foreground">
                                {dados.bairro} - {dados.cidade}/{dados.estado}
                            </p>
                            <p className="text-muted-foreground">CEP: {dados.cep}</p>
                        </CardContent>
                    </Card>

                    {/* Veículo */}
                    {(dados.veiculoMarca || dados.veiculoModelo || dados.veiculoPlaca) && (
                        <Card className="overflow-hidden">
                            <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Car className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <CardTitle className="text-lg">Veículo</CardTitle>
                                </div>
                                <Button variant="outline" size="sm" onClick={onEditarDados}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Editar
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {dados.veiculoMarca && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Marca</p>
                                            <p className="font-medium">{dados.veiculoMarca}</p>
                                        </div>
                                    )}
                                    {dados.veiculoModelo && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Modelo</p>
                                            <p className="font-medium">{dados.veiculoModelo}</p>
                                        </div>
                                    )}
                                    {dados.veiculoAno && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Ano</p>
                                            <p className="font-medium">{dados.veiculoAno}</p>
                                        </div>
                                    )}
                                    {dados.veiculoPlaca && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Placa</p>
                                            <p className="font-medium">{dados.veiculoPlaca}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Observações */}
                    {dados.observacoes && (
                        <Card className="overflow-hidden">
                            <CardHeader className="bg-muted/50">
                                <CardTitle className="text-lg">Observações</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-muted-foreground">{dados.observacoes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Coluna Lateral - Resumo Financeiro */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4 space-y-6">
                        {/* Resumo */}
                        <Card className="overflow-hidden border-2 border-primary/20">
                            <CardHeader className="bg-primary/5">
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    Resumo do Pagamento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Pneus ({totalItems})
                                        </span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>

                                    {totalServicos > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Serviços ({servicos.length})
                                            </span>
                                            <span>{formatPrice(totalServicos)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold">Total</span>
                                        <span className="text-2xl font-bold text-primary">
                                            {formatPrice(total)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Em até 12x no cartão
                                    </p>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full text-base font-semibold h-14"
                                    onClick={onConfirmar}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                            Confirmar e Pagar
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    Você será redirecionado para o Mercado Pago
                                </p>
                            </CardContent>
                        </Card>

                        {/* Garantias */}
                        <Card>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="font-medium text-sm">Compra Segura</p>
                                        <p className="text-xs text-muted-foreground">
                                            Pagamento via Mercado Pago
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="font-medium text-sm">Garantia de Qualidade</p>
                                        <p className="text-xs text-muted-foreground">
                                            Pneus inspecionados
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
