import { Header } from '@/components/cliente/Header'
import { Footer } from '@/components/cliente/Footer'
import WhatsAppButton from '@/components/cliente/WhatsAppButton'
import { Toaster } from 'sonner'

export default function ClienteLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppButton />
            <Toaster position="top-right" richColors />
        </div>
    )
}
