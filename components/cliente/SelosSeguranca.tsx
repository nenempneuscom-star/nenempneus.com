'use client'

import { Shield, Lock, CreditCard, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function SelosSeguranca() {
    return (
        <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Compra Segura */}
                    <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                            <Lock className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-green-900 leading-tight">Compra Segura</p>
                            <p className="text-green-700 text-[10px] leading-tight">SSL Certificado</p>
                        </div>
                    </div>

                    {/* Mercado Pago */}
                    <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-blue-900 leading-tight">Mercado Pago</p>
                            <p className="text-blue-700 text-[10px] leading-tight">Pagamento protegido</p>
                        </div>
                    </div>

                    {/* Garantia */}
                    <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                            <Shield className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-purple-900 leading-tight">Garantia 90 dias</p>
                            <p className="text-purple-700 text-[10px] leading-tight">Qualidade assegurada</p>
                        </div>
                    </div>

                    {/* Dados Protegidos */}
                    <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-emerald-900 leading-tight">Dados Protegidos</p>
                            <p className="text-emerald-700 text-[10px] leading-tight">Privacidade garantida</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
