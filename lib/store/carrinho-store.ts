import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ItemCarrinho {
    id: string
    nome: string
    slug: string
    preco: number
    quantidade: number
    specs: any
    imagemUrl?: string
}

// Configuração de Geometria
export interface GeometriaConfig {
    tipoVeiculo: 'popular' | 'moderno'
    incluirCambagem: boolean
    rodas: number // número de rodas para cambagem
}

// Configuração de Balanceamento
export interface BalanceamentoConfig {
    tipoAro: 'ferro' | 'liga'
    rodas: number // número de rodas
}

// Serviço configurado no carrinho
export interface ServicoConfigurado {
    id: 'geometria' | 'balanceamento'
    config: GeometriaConfig | BalanceamentoConfig
    preco: number
}

interface CarrinhoStore {
    items: ItemCarrinho[]
    servicos: ServicoConfigurado[] // Serviços configurados
    adicionarItem: (item: Omit<ItemCarrinho, 'quantidade'>, quantidade?: number) => void
    removerItem: (id: string) => void
    atualizarQuantidade: (id: string, quantidade: number) => void
    adicionarServico: (servico: ServicoConfigurado) => void
    removerServico: (servicoId: string) => void
    limparCarrinho: () => void
    getTotalItems: () => number
    getSubtotal: () => number
    getTotalServicos: () => number
    getTotal: () => number
}

// Função para calcular preço da geometria
export function calcularPrecoGeometria(config: GeometriaConfig): number {
    let preco = config.tipoVeiculo === 'popular' ? 60 : 80
    if (config.incluirCambagem) {
        preco += config.rodas * 50
    }
    return preco
}

// Função para calcular preço do balanceamento
export function calcularPrecoBalanceamento(config: BalanceamentoConfig): number {
    const precoPorRoda = config.tipoAro === 'ferro' ? 15 : 20
    return config.rodas * precoPorRoda
}

// Função para gerar descrição da geometria
export function gerarDescricaoGeometria(config: GeometriaConfig): string {
    const tipo = config.tipoVeiculo === 'popular' ? 'Carro Popular' : 'Carro Moderno'
    if (config.incluirCambagem) {
        return `Geometria ${tipo} + Cambagem (${config.rodas} ${config.rodas === 1 ? 'roda' : 'rodas'})`
    }
    return `Geometria ${tipo}`
}

// Função para gerar descrição do balanceamento
export function gerarDescricaoBalanceamento(config: BalanceamentoConfig): string {
    const tipo = config.tipoAro === 'ferro' ? 'Aro de Ferro' : 'Aro de Liga'
    return `Balanceamento ${tipo} (${config.rodas} ${config.rodas === 1 ? 'roda' : 'rodas'})`
}

export const useCarrinhoStore = create<CarrinhoStore>()(
    persist(
        (set, get) => ({
            items: [],
            servicos: [],

            adicionarItem: (item, quantidade = 1) => {
                set((state) => {
                    const itemExiste = state.items.find((i) => i.id === item.id)

                    if (itemExiste) {
                        return {
                            items: state.items.map((i) =>
                                i.id === item.id
                                    ? { ...i, quantidade: i.quantidade + quantidade }
                                    : i
                            ),
                        }
                    }

                    return {
                        items: [...state.items, { ...item, quantidade }],
                    }
                })
            },

            removerItem: (id) => {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                }))
            },

            atualizarQuantidade: (id, quantidade) => {
                if (quantidade <= 0) {
                    get().removerItem(id)
                    return
                }

                set((state) => ({
                    items: state.items.map((i) =>
                        i.id === id ? { ...i, quantidade } : i
                    ),
                }))
            },

            adicionarServico: (servico) => {
                set((state) => {
                    // Remove serviço existente do mesmo tipo
                    const servicosFiltrados = state.servicos.filter((s) => s.id !== servico.id)
                    return {
                        servicos: [...servicosFiltrados, servico],
                    }
                })
            },

            removerServico: (servicoId) => {
                set((state) => ({
                    servicos: state.servicos.filter((s) => s.id !== servicoId),
                }))
            },

            limparCarrinho: () => {
                set({ items: [], servicos: [] })
            },

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantidade, 0)
            },

            getSubtotal: () => {
                return get().items.reduce(
                    (total, item) => total + item.preco * item.quantidade,
                    0
                )
            },

            getTotalServicos: () => {
                return get().servicos.reduce((total, s) => total + s.preco, 0)
            },

            getTotal: () => {
                return get().getSubtotal() + get().getTotalServicos()
            },
        }),
        {
            name: 'carrinho-storage',
        }
    )
)
