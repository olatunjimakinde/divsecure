'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function HumanCheckContent() {
    const searchParams = useSearchParams()
    const target = searchParams.get('target')

    const handleVerify = () => {
        if (target) {
            window.location.href = target
        }
    }

    if (!target) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-muted/50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-destructive">Invalid Link</CardTitle>
                        <CardDescription>
                            Missing redirection target.
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
                        To protect your account, please confirm you are human to proceed with the verification.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Button onClick={handleVerify} size="lg" className="w-full">
                        Click to Verify
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default function HumanCheckPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HumanCheckContent />
        </Suspense>
    )
}
