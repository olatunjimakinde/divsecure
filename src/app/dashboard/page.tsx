import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '../(auth)/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { ManagerSummary } from '@/components/dashboard/manager-summary'
import { ResidentSummary } from '@/components/dashboard/resident-summary'
import { Greeting } from '@/components/dashboard/greeting'
import { Building2 } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const [membershipsResult, subscriptionResult] = await Promise.all([
        supabase
            .from('members')
            .select('role, community:communities(*)')
            .eq('user_id', user.id),
        supabase
            .from('subscriptions')
            .select('status, current_period_end')
            .eq('user_id', user.id)
            .single()
    ])

    const memberships = membershipsResult.data
    const subscription = subscriptionResult.data

    const communities = memberships?.map((m) => m.community) || []

    // Redirect guards to their security dashboard
    const guardMembership = memberships?.find(m => ['guard', 'head_of_security'].includes(m.role))
    if (guardMembership && guardMembership.community) {
        redirect(`/communities/${guardMembership.community.slug}/security`)
    }

    const isAllowed = (!!subscription && new Date(subscription.current_period_end!) > new Date()) || communities.length > 0

    return (
        <div className="min-h-screen bg-muted/30">
            <main className="p-4 lg:p-8">
                <div className="mx-auto max-w-6xl space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            {/* Dynamic Greeting */}
                            <Greeting name={user.user_metadata.full_name?.split(' ')[0] || 'User'} />
                            <p className="text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-700 delay-100">
                                Manage your communities and subscriptions.
                            </p>
                        </div>
                        {isAllowed ? (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-right-2 duration-500">
                                <Button asChild variant="outline" className="w-full sm:w-auto rounded-full shadow-sm hover:shadow-md transition-all">
                                    <Link href="/communities/create">Add Community</Link>
                                </Button>
                            </div>
                        ) : (
                            <Button asChild variant="default" className="w-full sm:w-auto rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                                <Link href="/subscribe">Subscribe to Create</Link>
                            </Button>
                        )}
                    </div>

                    {memberships?.length === 0 ? (
                        <Card className="text-center py-12 border-dashed border-2 bg-muted/10 hover:bg-muted/20 transition-colors animate-in zoom-in-95 duration-500 rounded-2xl">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 p-6 rounded-full w-24 h-24 flex items-center justify-center mb-6 ring-1 ring-primary/20">
                                    <Building2 className="h-12 w-12 text-primary" />
                                </div>
                                <CardTitle className="text-2xl font-bold">No Communities Yet</CardTitle>
                                <CardDescription className="text-base max-w-sm mx-auto mt-3 leading-relaxed">
                                    You haven&apos;t joined or created any communities. Get started by subscribing to a plan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center gap-4 mt-6">
                                    <Button asChild variant="default" size="lg" className="rounded-xl px-8 h-14 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform w-full sm:w-auto">
                                        <Link href="/subscribe?intent=new_community">Create Your First Community</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            {memberships?.map((membership) => (
                                <div key={membership.community.id} className="space-y-6">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-2xl font-bold tracking-tight">
                                            <Link href={`/communities/${membership.community.slug}`} className="hover:underline">
                                                {membership.community.name}
                                            </Link>
                                        </h2>
                                        <div className="flex items-center justify-between">
                                            <p className="text-muted-foreground text-base">
                                                {membership.role === 'community_manager' ? 'Manager Dashboard' : 'Resident Dashboard'}
                                            </p>
                                            <Button variant="outline" size="sm" asChild className="rounded-lg h-10 px-4">
                                                <Link href={`/communities/${membership.community.slug}`}>
                                                    View Details
                                                </Link>
                                            </Button>
                                        </div>
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
                            <div className="pt-6 border-t">
                                <Link href="/subscribe?intent=new_community">
                                    <Card className="border-dashed hover:bg-muted/50 transition-all hover:shadow-md cursor-pointer group flex items-center justify-center min-h-[120px] rounded-2xl">
                                        <CardContent className="flex items-center gap-3 text-muted-foreground group-hover:text-primary py-8">
                                            <span className="text-3xl font-light">+</span>
                                            <span className="font-semibold text-lg">Create Another Community</span>
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
