'use client'

import { useEffect, useState } from 'react'

export function DebugUrl() {
    const [url, setUrl] = useState('')

    useEffect(() => {
        setUrl(window.location.href)
    }, [])

    if (!url) return null

    return (
        <div className="mt-8 p-4 bg-muted rounded-md text-xs font-mono text-left w-full max-w-lg break-all border">
            <p className="font-bold mb-2 text-foreground">Debug Information (Please copy this):</p>
            <p className="text-muted-foreground">{url}</p>
        </div>
    )
}
