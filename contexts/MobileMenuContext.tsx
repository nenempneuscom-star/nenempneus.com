'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface MobileMenuContextType {
    isOpen: boolean
    isCollapsed: boolean
    open: () => void
    close: () => void
    toggle: () => void
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined)

// Páginas onde a sidebar deve ficar colapsada por padrão
const COLLAPSED_PAGES = ['/dashboard/whatsapp']

export function MobileMenuProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const pathname = usePathname()

    // Colapsar sidebar automaticamente em certas páginas
    useEffect(() => {
        const shouldCollapse = COLLAPSED_PAGES.some(page => pathname?.startsWith(page))
        setIsCollapsed(shouldCollapse)
        if (shouldCollapse) {
            setIsOpen(false)
        }
    }, [pathname])

    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)
    const toggle = () => setIsOpen(prev => !prev)

    return (
        <MobileMenuContext.Provider value={{ isOpen, isCollapsed, open, close, toggle }}>
            {children}
        </MobileMenuContext.Provider>
    )
}

export function useMobileMenu() {
    const context = useContext(MobileMenuContext)
    if (!context) {
        throw new Error('useMobileMenu must be used within a MobileMenuProvider')
    }
    return context
}
