'use client'

import { useEffect, useState } from 'react'

export function Greeting({ name }: { name: string }) {
    const [greeting, setGreeting] = useState('Welcome back')

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good morning')
        else if (hour < 18) setGreeting('Good afternoon')
        else setGreeting('Good evening')
    }, [])

    return (
        <h1 className="text-3xl font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-left-2 duration-500">
            {greeting}, <span className="text-primary">{name}</span>
        </h1>
    )
}
