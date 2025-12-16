'use client'


import { Button } from '@/components/ui/button'
import { verifyInvite } from '@/app/(auth)/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

function ConfirmPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const supabase = createClient()

    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/'

    // Handle Implicit Flow (Hash Fragment)
    useEffect(() => {
        const handleHash = async () => {
            const hash = window.location.hash
            if (hash && hash.includes('access_token')) {
                const params = new URLSearchParams(hash.substring(1)) // remove #
                const access_token = params.get('access_token')
                const refresh_token = params.get('refresh_token')

                if (access_token && refresh_token) {
                    const { error } = await supabase.auth.setSession({
                        access_token,
                        refresh_token
                    })

                    if (!error) {
                        router.push(next)
                    }
                }
            }
        }

        handleHash()
    }, [next, router, supabase.auth])


    console.log('Confirm Page Params:', {
        token_hash: token_hash ? 'present' : 'missing',
        type,
        code: code ? 'present' : 'missing',
        all: Object.fromEntries(searchParams.entries())
    })

    // 1. Handle Token Hash (Invite / Recovery / Magic Link)
    useEffect(() => {
        if (token_hash && type) {
            const form = document.getElementById('verify-invite-form') as HTMLFormElement
            if (form) form.requestSubmit()
        }
    }, [token_hash, type])

    // 2. Handle Code (PKCE exchange via callback)
    useEffect(() => {
        if (code) {
            const callbackUrl = `/auth/callback?code=${code}&next=${encodeURIComponent(next)}`
            router.replace(callbackUrl)
        }
    }, [code, next, router])

    if ((token_hash && type) || code) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-muted/50 p-4">
                <Card className="w-full max-w-md border-none shadow-none bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center pt-6">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="mt-4 text-sm text-muted-foreground">Verifying invitation...</p>

                        {/* Hidden form for token_hash verification */}
                        {token_hash && type && (
                            <form id="verify-invite-form" action={verifyInvite} className="hidden">
                                <input type="hidden" name="token_hash" value={token_hash} />
                                <input type="hidden" name="type" value={type} />
                                <input type="hidden" name="next" value={next} />
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!code && (!token_hash || !type)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-muted/50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <ShieldCheck className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle>Invalid Link</CardTitle>
                        <CardDescription>
                            This invitation link appears to be invalid or missing the verification code.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return null
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConfirmPageContent />
        </Suspense>
    )
}
