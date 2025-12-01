import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateCommunityForm } from './create-community-form'

export default async function CreateCommunityPage(props: {
    searchParams: Promise<{ reference?: string; plan_id?: string }>
}) {
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user has an active subscription or existing communities
    const supabaseAdmin = await createAdminClient()

    // Check for personal subscription
    const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .gt('current_period_end', new Date().toISOString())
        .maybeSingle()

    // Check for existing communities owned by user
    const { count: communityCount } = await supabaseAdmin
        .from('communities')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)

    const hasAccess = !!subscription || (communityCount && communityCount > 0) || !!searchParams.reference

    if (!hasAccess) {
        redirect('/subscribe')
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight">Create a Community</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Start your new community today.
                    </p>
                </div>
                <CreateCommunityForm
                    paymentRef={searchParams.reference}
                    planId={searchParams.plan_id}
                />
            </div>
        </div>
    )
}
