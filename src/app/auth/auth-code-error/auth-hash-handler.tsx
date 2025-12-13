'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export function AuthHashHandler() {
    const [status, setStatus] = useState<string>('')
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const handleAuthCheck = async () => {
            // 1. Check Query Params (Server-side redirects)
            const queryError = searchParams.get('error')
            const queryErrorCode = searchParams.get('error_code')
            const queryErrorDesc = searchParams.get('error_description')

            if (queryError || queryErrorCode) {
                if (queryErrorCode === 'otp_expired' || queryErrorDesc?.includes('expired')) {
                    setStatus('This link has expired. You may have already verified your account. Please try logging in. If the issue persists, try resetting your password.')
                } else if (queryErrorDesc?.includes('both auth code and code verifier')) {
                    setStatus('Verification failed due to a missing browser cookie. This happens if you open the link in a different browser or app (like Gmail) than where you signed up. Please try logging in directly, or copy the link and paste it into your original browser.')
                } else {
                    setStatus(queryErrorDesc ? queryErrorDesc.replace(/\+/g, ' ') : (queryError || 'An unknown error occurred'))
                }
                return
            }

            // 2. Check Hash Fragment (Client-side redirects)
            const hash = window.location.hash
            if (hash) {
                // Parse hash
                const params = new URLSearchParams(hash.substring(1)) // remove #
                const accessToken = params.get('access_token')
                const refreshToken = params.get('refresh_token')
                const type = params.get('type')
                const error = params.get('error')
                const errorCode = params.get('error_code')
                const errorDescription = params.get('error_description')

                if (error || errorCode) {
                    if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
                        setStatus('This link has expired. You may have already verified your account. Please try logging in. If the issue persists, try resetting your password.')
                    } else if (errorDescription) {
                        setStatus(errorDescription.replace(/\+/g, ' '))
                    } else {
                        setStatus('An validation error occurred.')
                    }
                    return
                }

                if (accessToken && refreshToken) {
                    setStatus('Recovering session from link...')
                    const supabase = createClient()

                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    })

                    if (error) {
                        console.error('Error setting session:', error)
                        setStatus('Failed to recover session: ' + error.message)
                    } else {
                        setStatus('Session recovered! Redirecting...')
                        // If it's an invite, we usually want them to set a password
                        if (type === 'invite' || type === 'recovery') {
                            router.push('/update-password')
                        } else {
                            router.push('/dashboard')
                        }
                    }
                }
            }
        }

        handleAuthCheck()
    }, [router, searchParams])

    if (!status) return null

    return (
        <div className="mt-4 p-4 bg-muted rounded-md text-sm">
            <p className="font-medium text-primary">{status}</p>
        </div>
    )
}
