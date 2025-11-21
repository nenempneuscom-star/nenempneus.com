import { Header } from '@/components/cliente/Header'
import { Footer } from '@/components/cliente/Footer'

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
        </div>
    )
}
