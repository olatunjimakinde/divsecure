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
    if (token_hash && type) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-muted/50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>Accept Invitation</CardTitle>
                        <CardDescription>
                            Please click the button below to accept your invitation and set up your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={verifyInvite}>
                            <input type="hidden" name="token_hash" value={token_hash} />
                            <input type="hidden" name="type" value={type} />
                            <input type="hidden" name="next" value={next} />
                            <Button className="w-full" size="lg" type="submit">
                                Accept & Continue
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // 2. Handle Code (PKCE exchange via callback)
    // Construct the callback URL
    // We need to pass the code and next param to the callback route
    const callbackUrl = `/auth/callback?code=${code}&next=${encodeURIComponent(next)}`

    if (!code) {
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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Security Check</CardTitle>
                    <CardDescription>
                        To protect your account, please click the button below to verify your invitation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full" size="lg">
                        <a href={callbackUrl}>Verify & Continue</a>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConfirmPageContent />
        </Suspense>
    )
}
