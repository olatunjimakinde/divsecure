'use client'

import { verifyEmailOtp } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function VerifyEmailForm() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''
    const error = searchParams.get('error')

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Verify your email</CardTitle>
                <CardDescription>
                    {email ? (
                        <>
                            Please enter the 6-digit code sent to <strong>{email}</strong>
                        </>
                    ) : (
                        <>
                            Please enter your email address and the 6-digit verification code from your email
                        </>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={verifyEmailOtp} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={email}
                            placeholder="Enter your email address"
                            required
                            className={email ? "bg-muted text-muted-foreground" : ""}
                            readOnly={!!email}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="code">Verification Code</Label>
                        <Input
                            id="code"
                            name="code"
                            type="text"
                            placeholder="123456"
                            required
                            pattern="[0-9]{6}"
                            maxLength={6}
                            className="text-center text-lg tracking-widest"
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-destructive font-medium">{error}</p>
                    )}
                    <Button type="submit" className="w-full">
                        Verify Account
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailForm />
        </Suspense>
    )
}
