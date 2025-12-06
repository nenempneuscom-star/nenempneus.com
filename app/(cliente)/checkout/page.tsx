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
        // Verificar se há flag de redirecionamento de pagamento aprovado
        const paymentRedirect = sessionStorage.getItem('payment_success_redirect')
        if (paymentRedirect) {
            // Limpar flag e não redirecionar para carrinho
            sessionStorage.removeItem('payment_success_redirect')
            return
        }

        if (items.length === 0) {
            router.push('/carrinho')
        }
    }, [items, router])

    // Verificar flag também no render para evitar flash
    if (items.length === 0) {
        const paymentRedirect = typeof window !== 'undefined'
            ? sessionStorage.getItem('payment_success_redirect')
            : null
        if (!paymentRedirect) {
            return null
        }
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
