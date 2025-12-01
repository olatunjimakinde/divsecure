'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AuthHashHandler() {
    const [status, setStatus] = useState<string>('')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const handleHash = async () => {
            const hash = window.location.hash
            if (!hash) return

            // Parse hash
            const params = new URLSearchParams(hash.substring(1)) // remove #
            const accessToken = params.get('access_token')
            const refreshToken = params.get('refresh_token')
            const type = params.get('type')

            if (accessToken && refreshToken) {
                setStatus('Recovering session from link...')

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

        handleHash()
    }, [router, supabase.auth])

    if (!status) return null

    return (
        <div className="mt-4 p-4 bg-muted rounded-md text-sm">
            <p className="font-medium text-primary">{status}</p>
        </div>
    )
}
