import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { GoogleTagManager, GoogleTagManagerNoScript } from '@/components/GoogleTagManager'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NenemPneus.com - Pneus Seminovos de Qualidade',
  description: 'Pneus seminovos com até 50% de desconto. Garantia e segurança.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <GoogleTagManager />
      </head>
      <body className={inter.className}>
        <GoogleTagManagerNoScript />
        {children}
      </body>
    </html>
  )
}
