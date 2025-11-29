'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function AuthConfirmContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleAuth = async () => {
            const supabase = createClient()

            // 1. Check for hash fragment (Implicit Flow)
            const hash = window.location.hash
            if (hash && hash.includes('access_token')) {
                try {
                    const { data: { session }, error } = await supabase.auth.getSession()

                    if (error) throw error

                    if (session) {
                        // Success! Redirect.
                        const next = searchParams.get('next') || '/dashboard'
                        router.push(next)
                        return
                    }
                } catch (e: any) {
                    console.error('Error processing hash:', e)
                    setError(e.message)
                }
            }

            // 2. Fallback: Check if we are already logged in (maybe the cookie was set by a previous step?)
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const next = searchParams.get('next') || '/dashboard'
                router.push(next)
                return
            }

            // If we are here, we might have failed to get the session.
            // Let's try to manually set the session if automatic detection failed but we have the hash.
            if (hash && hash.includes('access_token')) {
                // Extract tokens
                const params = new URLSearchParams(hash.substring(1)) // remove #
                const accessToken = params.get('access_token')
                const refreshToken = params.get('refresh_token')

                if (accessToken && refreshToken) {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    })

                    if (!error) {
                        const next = searchParams.get('next') || '/dashboard'
                        router.push(next)
                        return
                    } else {
                        setError(error.message)
                    }
                }
            } else {
                // No hash, and not logged in.
                // Maybe redirected here without params?
                setError('Invalid authentication link.')
            }
        }

        handleAuth()
    }, [router, searchParams])

    if (error) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 px-4 text-center">
                <h1 className="text-2xl font-bold text-destructive">Authentication Failed</h1>
                <p className="text-muted-foreground">{error}</p>
                <button
                    onClick={() => router.push('/login')}
                    className="text-sm underline"
                >
                    Back to Login
                </button>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Verifying...</p>
            </div>
        </div>
    )
}

export default function AuthConfirmPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <AuthConfirmContent />
        </Suspense>
    )
}
