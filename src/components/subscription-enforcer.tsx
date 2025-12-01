'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export function SubscriptionEnforcer({
    children,
    isExpired,
    isManager,
    communitySlug
}: {
    children: React.ReactNode
    isExpired: boolean
    isManager: boolean
    communitySlug: string
}) {
    const pathname = usePathname()

    if (!isExpired) {
        return <>{children}</>
    }

    // Allow access to billing page for managers
    if (isManager && pathname?.includes('/manager/settings/billing')) {
        return <>{children}</>
    }

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-4">
            <div className="bg-destructive/10 text-destructive p-6 rounded-full mb-6">
                <AlertTriangle className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Subscription Expired</h1>
            <p className="text-muted-foreground max-w-md mb-8">
                The subscription for this community has expired or is inactive. Access is currently restricted.
            </p>

            {isManager ? (
                <div className="space-y-4">
                    <p className="font-medium">As the Community Manager, please renew your subscription to restore access.</p>
                    <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                        <Link href={`/communities/${communitySlug}/manager/settings/billing`}>
                            Renew Subscription
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p>Please contact your Community Manager to resolve this issue.</p>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">Return to Dashboard</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
