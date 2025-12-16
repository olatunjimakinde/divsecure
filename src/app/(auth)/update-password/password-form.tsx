'use client'

import { updatePassword } from '../actions'
import { SubmitButton } from '@/components/submit-button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function UpdatePasswordForm({ error }: { error?: string }) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const requirements = [
        { label: 'At least 6 characters', valid: password.length >= 6 },
        { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
        { label: 'Contains number', valid: /[0-9]/.test(password) },
        { label: 'Contains symbol', valid: /[^A-Za-z0-9]/.test(password) },
    ]

    const validCount = requirements.filter(r => r.valid).length
    const strengthScore = (validCount / requirements.length) * 100

    let strengthColor = 'bg-slate-200'
    let strengthLabel = 'Weak'
    if (validCount >= 2) {
        strengthColor = 'bg-yellow-500'
        strengthLabel = 'Fair'
    }
    if (validCount >= 3) {
        strengthColor = 'bg-blue-500'
        strengthLabel = 'Good'
    }
    if (validCount === 4) {
        strengthColor = 'bg-green-500'
        strengthLabel = 'Strong'
    }
    if (password.length === 0) {
        strengthColor = 'bg-muted'
        strengthLabel = ''
    }

    return (
        <form action={updatePassword} className="w-full space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <PasswordInput
                        id="password"
                        name="password"
                        placeholder="Enter new password"
                        required
                        minLength={6}
                        className="h-12 rounded-xl"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {/* Password Strength Meter */}
                    {password.length > 0 && (
                        <div className="space-y-2 pt-1 animate-in slide-in-from-top-1 fade-in duration-300">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Password Strength</span>
                                <span className={cn("font-medium",
                                    validCount === 4 ? "text-green-600" :
                                        validCount >= 3 ? "text-blue-600" :
                                            validCount >= 2 ? "text-yellow-600" : "")}>
                                    {strengthLabel}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full transition-all duration-500 ease-out", strengthColor)}
                                    style={{ width: `${Math.max(5, strengthScore)}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                {requirements.map((req, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        {req.valid ? (
                                            <Check className="h-3.5 w-3.5 text-green-500" />
                                        ) : (
                                            <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                                        )}
                                        <span className={cn(req.valid && "text-foreground")}>{req.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Confirm new password"
                        required
                        minLength={6}
                        className="h-12 rounded-xl"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-destructive animate-pulse">Passwords do not match</p>
                    )}
                </div>
            </div>

            {error && (
                <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg">
                    {error}
                </div>
            )}

            <SubmitButton className="w-full h-12 rounded-xl mt-6">
                Update Password
            </SubmitButton>
        </form>
    )
}
