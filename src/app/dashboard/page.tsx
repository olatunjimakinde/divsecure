import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '../(auth)/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { ManagerSummary } from '@/components/dashboard/manager-summary'
import { ResidentSummary } from '@/components/dashboard/resident-summary'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: memberships } = await supabase
        .from('members')
        .select('role, community:communities(*)')
        .eq('user_id', user.id)

    const communities = memberships?.map((m) => m.community) || []

    // Redirect guards to their security dashboard
    const guardMembership = memberships?.find(m => ['guard', 'head_of_security'].includes(m.role))
    if (guardMembership && guardMembership.community) {
        redirect(`/communities/${guardMembership.community.slug}/security`)
    }

    // Check for active subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .single()

    const isAllowed = (!!subscription && new Date(subscription.current_period_end!) > new Date()) || communities.length > 0

    return (
        <div className="min-h-screen bg-muted/30">
            <main className="p-4 lg:p-8">
                <div className="mx-auto max-w-6xl space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                            <p className="text-muted-foreground">
                                Manage your communities and subscriptions.
                            </p>
                        </div>
                        {isAllowed ? (
                            <div className="flex gap-2">
                                <Button asChild variant="outline" className="w-full sm:w-auto">
                                    <Link href="/communities/create">Add Community</Link>
                                </Button>
                            </div>
                        ) : (
                            <Button asChild variant="default" className="w-full sm:w-auto">
                                <Link href="/subscribe">Subscribe to Create</Link>
                            </Button>
                        )}
                    </div>

                    {memberships?.length === 0 ? (
                        <Card className="text-center py-12 border-dashed">
                            <CardHeader>
                                <CardTitle>Welcome to Community SaaS</CardTitle>
                                <CardDescription>
                                    You haven&apos;t created any communities yet. Subscribe to a plan to get started.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center gap-4">
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        Click the button below to subscribe and create a secured environment for your community.
                                    </p>
                                    <Button asChild variant="default" size="lg">
                                        <Link href="/subscribe?intent=new_community">Subscribe to Create Community</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            {memberships?.map((membership) => (
                                <div key={membership.community.id} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight">
                                                <Link href={`/communities/${membership.community.slug}`} className="hover:underline">
                                                    {membership.community.name}
                                                </Link>
                                            </h2>
                                            <p className="text-muted-foreground">
                                                {membership.role === 'community_manager' ? 'Manager Dashboard' : 'Resident Dashboard'}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/communities/${membership.community.slug}`}>
                                                View Details
                                            </Link>
                                        </Button>
                                    </div>

                                    {['community_manager', 'head_of_security'].includes(membership.role) ? (
                                        <ManagerSummary
                                            communityId={membership.community.id}
                                            communitySlug={membership.community.slug}
                                        />
                                    ) : (
                                        <ResidentSummary
                                            communityId={membership.community.id}
                                            communitySlug={membership.community.slug}
                                            userId={user.id}
                                        />
                                    )}
                                </div>
                            ))}

                            {/* Add Community Card */}
                            <div className="pt-4 border-t">
                                <Link href="/subscribe?intent=new_community">
                                    <Card className="border-dashed hover:bg-muted/50 transition-all hover:shadow-md cursor-pointer group flex items-center justify-center min-h-[100px]">
                                        <CardContent className="flex items-center gap-2 text-muted-foreground group-hover:text-primary py-6">
                                            <span className="text-2xl">+</span>
                                            <span className="font-medium">Create Another Community</span>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
