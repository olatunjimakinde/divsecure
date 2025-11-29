"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
    password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthProps) {
    const requirements = [
        { test: (p: string) => p.length >= 6 },
        { test: (p: string) => /[A-Z]/.test(p) },
        { test: (p: string) => /[a-z]/.test(p) },
        { test: (p: string) => /[0-9]/.test(p) },
        { test: (p: string) => /[^A-Za-z0-9]/.test(p) },
    ]

    const metCount = requirements.reduce((acc, req) => acc + (req.test(password) ? 1 : 0), 0)
    const score = (metCount / requirements.length) * 100

    let color = "bg-muted"
    let label = "Enter password"

    if (password.length > 0) {
        if (metCount <= 2) {
            color = "bg-red-500"
            label = "Weak"
        } else if (metCount <= 4) {
            color = "bg-yellow-500"
            label = "Medium"
        } else {
            color = "bg-green-500"
            label = "Strong"
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Password strength</span>
                <span className={cn("font-medium", password.length > 0 && color.replace("bg-", "text-"))}>
                    {label}
                </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                    className={cn("h-full transition-all duration-500 ease-out", color)}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    )
}
