'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Mail, Loader2, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [loading, setLoading] = useState(false)
    const [erro, setErro] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErro('')

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            })

            const data = await response.json()

            if (data.success) {
                router.push('/dashboard')
                router.refresh()
            } else {
                setErro(data.error || 'Erro ao fazer login')
            }
        } catch {
            setErro('Erro de conexão. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/50">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-yellow-500/5 animate-gradient-shift" />

            {/* Background Pattern */}
            <div className="absolute inset-0 gear-pattern opacity-30" />

            {/* Animated Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-orb-1" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-orb-2" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-3xl animate-orb-3" />
                <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/8 rounded-full blur-3xl animate-orb-4" />
                <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-yellow-500/8 rounded-full blur-3xl animate-orb-5" />
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(30)].map((_, i) => (
                    <div
                        key={`particle-${i}`}
                        className="absolute w-1 h-1 bg-primary/30 rounded-full animate-particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${i * 0.3}s`,
                            animationDuration: `${8 + Math.random() * 8}s`,
                        }}
                    />
                ))}
            </div>

            {/* Floating Stars */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={`star-${i}`}
                        className="absolute animate-twinkle"
                        style={{
                            left: `${5 + Math.random() * 90}%`,
                            top: `${5 + Math.random() * 90}%`,
                            animationDelay: `${i * 0.4}s`,
                        }}
                    >
                        <div className="w-2 h-2 bg-primary/40 rotate-45 transform" />
                    </div>
                ))}
            </div>

            {/* Floating Sparkles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <Sparkles
                        key={i}
                        className="absolute text-primary/25 animate-float"
                        style={{
                            left: `${10 + i * 12}%`,
                            top: `${15 + (i % 4) * 20}%`,
                            animationDelay: `${i * 0.5}s`,
                            fontSize: `${14 + i * 3}px`,
                        }}
                    />
                ))}
            </div>

            {/* Moving Lines */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-line-1" />
                <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent animate-line-2" />
                <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-line-3" />
            </div>

            {/* Hero Message */}
            <div
                className={`text-center mb-8 z-10 transition-all duration-1000 ${
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
                }`}
            >
                <div className="relative inline-block">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-primary/30 via-yellow-500/20 to-primary/30 animate-pulse" />

                    <h1 className="relative text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-500 to-primary animate-gradient-x">
                        DEUS TE ABENÇOE
                    </h1>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
                </div>
            </div>

            {/* Login Card */}
            <div
                className={`relative z-10 w-full max-w-md px-4 transition-all duration-1000 delay-300 ${
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
            >
                {/* Card Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-xl rounded-3xl" />

                {/* Card */}
                <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shine" />

                    {/* Header */}
                    <div className="text-center pt-8 pb-4 px-6">
                        {/* Lock Icon with Animation */}
                        <div className="mx-auto w-16 h-16 relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                            <div className="relative w-full h-full bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                                <Lock className="h-7 w-7 text-primary-foreground" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Área Administrativa
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Entre com suas credenciais para acessar o painel
                        </p>
                    </div>

                    {/* Form */}
                    <div className="px-6 pb-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {erro && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm animate-shake">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {erro}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email
                                </Label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary/30 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
                                            placeholder="seu@email.com"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="senha" className="text-sm font-medium">
                                    Senha
                                </Label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary/30 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="senha"
                                            type="password"
                                            value={senha}
                                            onChange={(e) => setSenha(e.target.value)}
                                            className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-all duration-300"
                                            placeholder="••••••••"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-semibold relative overflow-hidden group mt-2"
                                disabled={loading}
                            >
                                {/* Button Shine */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    <span className="relative">Entrar</span>
                                )}
                            </Button>

                            <Link href="/" className="block mt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Voltar para a loja
                                </Button>
                            </Link>
                        </form>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <p
                className={`mt-8 text-sm text-muted-foreground/60 z-10 transition-all duration-1000 delay-500 ${
                    mounted ? 'opacity-100' : 'opacity-0'
                }`}
            >
                Nenem Pneus © {new Date().getFullYear()}
            </p>

            {/* Custom Styles */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 0.3;
                    }
                    50% {
                        transform: translateY(-20px) rotate(10deg);
                        opacity: 0.6;
                    }
                }

                @keyframes gradient-x {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }

                @keyframes gradient-shift {
                    0%, 100% {
                        opacity: 0.5;
                        transform: scale(1) rotate(0deg);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.1) rotate(2deg);
                    }
                }

                @keyframes shine {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }

                @keyframes orb-1 {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                        opacity: 0.15;
                    }
                    25% {
                        transform: translate(-30px, 40px) scale(1.1);
                        opacity: 0.25;
                    }
                    50% {
                        transform: translate(-60px, 20px) scale(0.9);
                        opacity: 0.2;
                    }
                    75% {
                        transform: translate(-20px, -30px) scale(1.05);
                        opacity: 0.18;
                    }
                }

                @keyframes orb-2 {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                        opacity: 0.1;
                    }
                    33% {
                        transform: translate(50px, -40px) scale(1.15);
                        opacity: 0.2;
                    }
                    66% {
                        transform: translate(30px, 50px) scale(0.95);
                        opacity: 0.15;
                    }
                }

                @keyframes orb-3 {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 0.05;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.2);
                        opacity: 0.12;
                    }
                }

                @keyframes orb-4 {
                    0%, 100% {
                        transform: translate(0, 0);
                        opacity: 0.08;
                    }
                    50% {
                        transform: translate(40px, 60px);
                        opacity: 0.15;
                    }
                }

                @keyframes orb-5 {
                    0%, 100% {
                        transform: translate(0, 0);
                        opacity: 0.08;
                    }
                    50% {
                        transform: translate(-50px, -40px);
                        opacity: 0.12;
                    }
                }

                @keyframes particle {
                    0% {
                        transform: translateY(0) translateX(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.6;
                    }
                    90% {
                        opacity: 0.6;
                    }
                    100% {
                        transform: translateY(-100vh) translateX(50px);
                        opacity: 0;
                    }
                }

                @keyframes twinkle {
                    0%, 100% {
                        opacity: 0.2;
                        transform: scale(0.8) rotate(45deg);
                    }
                    50% {
                        opacity: 0.8;
                        transform: scale(1.2) rotate(45deg);
                    }
                }

                @keyframes line-1 {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }

                @keyframes line-2 {
                    0% {
                        transform: translateX(100%);
                    }
                    100% {
                        transform: translateX(-100%);
                    }
                }

                @keyframes line-3 {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }

                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }

                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s ease infinite;
                }

                .animate-gradient-shift {
                    animation: gradient-shift 8s ease-in-out infinite;
                }

                .animate-shine {
                    animation: shine 3s ease-in-out infinite;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }

                .animate-orb-1 {
                    animation: orb-1 12s ease-in-out infinite;
                }

                .animate-orb-2 {
                    animation: orb-2 15s ease-in-out infinite;
                }

                .animate-orb-3 {
                    animation: orb-3 10s ease-in-out infinite;
                }

                .animate-orb-4 {
                    animation: orb-4 18s ease-in-out infinite;
                }

                .animate-orb-5 {
                    animation: orb-5 14s ease-in-out infinite;
                }

                .animate-particle {
                    animation: particle 12s linear infinite;
                }

                .animate-twinkle {
                    animation: twinkle 3s ease-in-out infinite;
                }

                .animate-line-1 {
                    animation: line-1 8s linear infinite;
                }

                .animate-line-2 {
                    animation: line-2 10s linear infinite;
                }

                .animate-line-3 {
                    animation: line-3 12s linear infinite;
                }
            `}</style>
        </div>
    )
}
