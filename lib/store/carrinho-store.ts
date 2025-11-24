import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ItemCarrinho {
    id: string
    nome: string
    slug: string
    preco: number
    quantidade: number
    specs: any
}

export interface ServicoCarrinho {
    id: string
    nome: string
    preco: number
    descricao: string
}

// Serviços disponíveis para upsell
export const SERVICOS_DISPONIVEIS: ServicoCarrinho[] = [
    {
        id: 'geometria',
        nome: 'Geometria',
        preco: 120,
        descricao: 'Alinhamento completo das rodas'
    },
    {
        id: 'balanceamento',
        nome: 'Balanceamento',
        preco: 80,
        descricao: 'Balanceamento de todas as rodas'
    }
]

interface CarrinhoStore {
    items: ItemCarrinho[]
    servicos: string[] // IDs dos serviços selecionados
    adicionarItem: (item: Omit<ItemCarrinho, 'quantidade'>, quantidade?: number) => void
    removerItem: (id: string) => void
    atualizarQuantidade: (id: string, quantidade: number) => void
    toggleServico: (servicoId: string) => void
    limparCarrinho: () => void
    getTotalItems: () => number
    getSubtotal: () => number
    getTotalServicos: () => number
    getTotal: () => number
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

            toggleServico: (servicoId) => {
                set((state) => {
                    const existe = state.servicos.includes(servicoId)
                    if (existe) {
                        return {
                            servicos: state.servicos.filter((id) => id !== servicoId),
                        }
                    }
                    return {
                        servicos: [...state.servicos, servicoId],
                    }
                })
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
                const servicosSelecionados = get().servicos
                return SERVICOS_DISPONIVEIS
                    .filter((s) => servicosSelecionados.includes(s.id))
                    .reduce((total, s) => total + s.preco, 0)
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
