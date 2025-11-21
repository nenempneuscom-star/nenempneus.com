'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckoutForm } from '@/components/cliente/CheckoutForm'
import { ResumoPedido } from '@/components/cliente/ResumoPedido'
import { useCarrinhoStore } from '@/lib/store/carrinho-store'

export default function CheckoutPage() {
    const router = useRouter()
    const { items } = useCarrinhoStore()

    useEffect(() => {
        if (items.length === 0) {
            router.push('/carrinho')
        }
    }, [items, router])

    if (items.length === 0) {
        return null
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-8">Finalizar Compra</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulário */}
                <div className="lg:col-span-2">
                    <CheckoutForm />
                </div>

                {/* Resumo */}
                <div>
                    <ResumoPedido />
                </div>
            </div>
        </div>
    )
}
