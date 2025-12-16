import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '../(auth)/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { ManagerSummary } from '@/components/dashboard/manager-summary'
import { ResidentSummary } from '@/components/dashboard/resident-summary'
import { Greeting } from '@/components/dashboard/greeting'
import { Building2, Plus } from 'lucide-react'

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
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-8 lg:space-y-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-4">
                        <div className="space-y-1.5">
                            {/* Dynamic Greeting */}
                            <Greeting name={user.user_metadata.full_name?.split(' ')[0] || 'User'} />
                            <p className="text-base text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-700 delay-100">
                                Manage your communities and subscriptions.
                            </p>
                        </div>
                        {isAllowed ? (
                            <div className="flex gap-3 animate-in fade-in slide-in-from-right-2 duration-500 w-full sm:w-auto">
                                <Button asChild variant="outline" className="w-full sm:w-auto rounded-full h-10 shadow-sm hover:shadow-md transition-all border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                                    <Link href="/communities/create">
                                        <Building2 className="mr-2 h-4 w-4 text-primary" />
                                        Add Community
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <Button asChild variant="default" className="w-full sm:w-auto rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                                <Link href="/subscribe?intent=new_community">Subscribe to Create</Link>
                            </Button>
                        )}
                    </div>

                    {memberships?.length === 0 ? (
                        <Card className="text-center py-16 border-dashed border-2 bg-muted/5 hover:bg-muted/10 transition-colors animate-in zoom-in-95 duration-500 rounded-3xl">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 p-6 rounded-full w-24 h-24 flex items-center justify-center mb-6 ring-1 ring-primary/20 shadow-inner">
                                    <Building2 className="h-10 w-10 text-primary" />
                                </div>
                                <CardTitle className="text-2xl font-bold tracking-tight">No Communities Yet</CardTitle>
                                <CardDescription className="text-base max-w-md mx-auto mt-3 leading-relaxed">
                                    You haven&apos;t joined or created any communities. Get started by subscribing to a plan or asking a manager for an invite.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center gap-4 mt-6">
                                    <Button asChild variant="default" size="lg" className="rounded-2xl px-8 h-12 text-base font-semibold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform w-full sm:w-auto">
                                        <Link href="/subscribe?intent=new_community">Create Your First Community</Link>
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">Start your 14-day free trial</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-10">
                            {memberships?.map((membership) => (
                                <div key={membership.community.id} className="space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b pb-4">
                                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/90">
                                            <Link href={`/communities/${membership.community.slug}`} className="hover:text-primary transition-colors">
                                                {membership.community.name}
                                            </Link>
                                        </h2>
                                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                                                {membership.role === 'community_manager' ? 'Manager Dashboard' : 'Resident Dashboard'}
                                            </p>
                                            <Button variant="ghost" size="sm" asChild className="rounded-full hover:bg-primary/10 hover:text-primary">
                                                <Link href={`/communities/${membership.community.slug}`}>
                                                    View Details &rarr;
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
                            <div className="pt-8 border-t">
                                <Link href="/subscribe?intent=new_community">
                                    <Card className="border-dashed border-2 hover:border-primary/50 hover:bg-muted/30 transition-all hover:shadow-md cursor-pointer group flex items-center justify-center min-h-[140px] rounded-3xl">
                                        <CardContent className="flex flex-col sm:flex-row items-center gap-4 text-muted-foreground group-hover:text-primary py-8 px-6 text-center sm:text-left">
                                            <div className="bg-muted group-hover:bg-primary/10 p-3 rounded-full transition-colors">
                                                <Plus className="h-6 w-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="font-semibold text-lg block">Create Another Community</span>
                                                <span className="text-sm font-normal text-muted-foreground/80 block">Manage multiple properties from one account</span>
                                            </div>
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
