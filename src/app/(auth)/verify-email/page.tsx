'use client'

import { verifyEmailOtp } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '@/components/ui/glass-card'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

function VerifyEmailForm() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''
    const error = searchParams.get('error')

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10 bg-gradient-soft opacity-70" />
            <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse" />
            <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] opacity-30" />

            <Link href="/login" className="absolute top-8 left-8 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium z-10">
                <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>

            <GlassCard className="w-full max-w-md p-8 md:p-10 border-white/20 dark:border-white/10 shadow-2xl">
                <div className="flex flex-col items-center w-full mb-8 text-center">
                    <div className="h-16 w-16 mb-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Mail className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-4">Verify your email</h1>
                    <div className="text-muted-foreground text-sm max-w-xs mx-auto">
                        {email ? (
                            <>
                                Please enter the 8-digit code sent to <strong className="text-foreground">{email}</strong>
                            </>
                        ) : (
                            <>
                                Please enter your email address and the 8-digit verification code from your email
                            </>
                        )}
                    </div>
                </div>

                <form action={verifyEmailOtp} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-medium uppercase text-muted-foreground">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            key={email || 'no-email'}
                            defaultValue={email}
                            placeholder="Enter your email address"
                            required
                            className={`h-12 rounded-xl bg-white/50 dark:bg-black/20 border-border/50 ${email ? "font-medium opacity-80" : ""}`}
                            readOnly={!!email}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-xs font-medium uppercase text-muted-foreground">Verification Code</Label>
                        <Input
                            id="code"
                            name="code"
                            type="text"
                            placeholder="12345678"
                            required
                            pattern="[0-9]{8}"
                            maxLength={8}
                            className="h-14 rounded-xl text-center text-2xl tracking-[0.5em] font-mono bg-white/50 dark:bg-black/20 border-border/50 uppercase"
                        />
                    </div>
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center border border-destructive/20 font-medium">
                            {error}
                        </div>
                    )}
                    <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-base font-semibold">
                        Verify Account
                    </Button>
                </form>
            </GlassCard>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailForm />
        </Suspense>
    )
}
