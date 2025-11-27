'use client'

import { MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { LOJA_INFO } from '@/lib/constants'

export default function WhatsAppButton() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Aparecer após 1 segundo
        const timer = setTimeout(() => setIsVisible(true), 1000)
        return () => clearTimeout(timer)
    }, [])

    const handleClick = () => {
        const message = 'Olá! Vim do site e gostaria de saber mais sobre os pneus.'
        const url = `https://wa.me/${LOJA_INFO.whatsapp}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    return (
        <button
            onClick={handleClick}
            className={`fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 flex items-center gap-2 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
            aria-label="Falar no WhatsApp"
        >
            {/* Animação de pulso */}
            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>

            {/* Ícone */}
            <MessageCircle className="h-6 w-6 relative z-10" />

            {/* Texto (aparece no hover em desktop) */}
            <span className="hidden md:group-hover:inline-block relative z-10 whitespace-nowrap font-medium">
                Tire suas dúvidas
            </span>
        </button>
    )
}
