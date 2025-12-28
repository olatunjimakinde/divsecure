'use client'

import { useEffect, useState } from 'react'

interface FormattedDateProps {
    date: string | Date | null | undefined
    options?: Intl.DateTimeFormatOptions
    type?: 'date' | 'time' | 'datetime'
    className?: string
}

export function FormattedDate({ date, options, type = 'datetime', className }: FormattedDateProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!date) return <span className={className}>-</span>

    if (!mounted) {
        // Return a placeholder or server-rendered time to avoid layout shift if possible,
        // but for timezone fixes specifically, we often want to avoid showing the WRONG time.
        // We'll show a subtle loading state or the server time with a suppress hydration warning if we preferred.
        // Given the requirement is "fix the time", showing nothing briefly is better than showing wrong time.
        return <span className={`opacity-0 ${className}`}>...</span>
    }

    const d = new Date(date)

    // Invalid date check
    if (isNaN(d.getTime())) return <span className={className}>Invalid Date</span>

    let content
    if (type === 'time') {
        content = d.toLocaleTimeString(undefined, options)
    } else if (type === 'date') {
        content = d.toLocaleDateString(undefined, options)
    } else {
        content = d.toLocaleString(undefined, options)
    }

    return <span className={className}>{content}</span>
}
