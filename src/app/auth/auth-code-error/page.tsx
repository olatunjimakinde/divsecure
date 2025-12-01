import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DebugUrl } from './debug-url'
import { AuthHashHandler } from './auth-hash-handler'

export default function AuthCodeErrorPage() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 px-4 text-center">
            <h1 className="text-4xl font-bold text-destructive">Authentication Error</h1>
            <p className="text-muted-foreground max-w-md">
                There was a problem verifying your identity. The link may have expired or is invalid.
            </p>
            <AuthHashHandler />
            <Button asChild>
                <Link href="/login">Back to Login</Link>
            </Button>
            <DebugUrl />
        </div>
    )
}
