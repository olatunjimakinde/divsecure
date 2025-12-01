import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SetupCommunityForm } from './setup-form'

export default async function SetupCommunityPage(props: {
    searchParams: Promise<{ plan_id?: string; reference?: string; trxref?: string }>
}) {
    const searchParams = await props.searchParams
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Paystack returns 'trxref' and 'reference' (usually same)
    const reference = searchParams.reference || searchParams.trxref

    if (!reference && !searchParams.plan_id) {
        // If no reference and no plan_id (free plan flow might use plan_id directly if we skip payment)
        // But for now we expect a reference for paid plans or a plan_id for free plans
        redirect('/dashboard')
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-lg border-none shadow-lg sm:rounded-xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Setup Your Community</CardTitle>
                    <CardDescription>
                        You&apos;re almost there! Enter your community details to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SetupCommunityForm
                        reference={reference}
                        planId={searchParams.plan_id}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
