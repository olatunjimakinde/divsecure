'use client'

import { useEffect, useRef } from 'react'
import { signout } from '@/app/(auth)/actions'
import { toast } from 'sonner'

interface AutoLogoutProps {
    timeoutMs?: number // Default 15 minutes
}

export function AutoLogout({ timeoutMs = 15 * 60 * 1000 }: AutoLogoutProps) {
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const resetTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }

            timerRef.current = setTimeout(async () => {
                toast.warning('Session expired due to inactivity.')
                await signout()
            }, timeoutMs)
        }

        // Initial start
        resetTimer()

        // Event listeners
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

        const handleActivity = () => {
            resetTimer()
        }

        events.forEach(event => {
            window.addEventListener(event, handleActivity)
        })

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity)
            })
        }
    }, [timeoutMs])

    return null
}
