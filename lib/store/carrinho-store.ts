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

interface CarrinhoStore {
    items: ItemCarrinho[]
    adicionarItem: (item: Omit<ItemCarrinho, 'quantidade'>, quantidade?: number) => void
    removerItem: (id: string) => void
    atualizarQuantidade: (id: string, quantidade: number) => void
    limparCarrinho: () => void
    getTotalItems: () => number
    getSubtotal: () => number
}


export const useCarrinhoStore = create<CarrinhoStore>()(
    persist(
        (set, get) => ({
            items: [],

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

            limparCarrinho: () => {
                set({ items: [] })
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
        }),
        {
            name: 'carrinho-storage',
        }
    )
)
