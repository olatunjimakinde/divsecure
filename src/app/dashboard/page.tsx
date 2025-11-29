import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '../(auth)/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

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

    // Check access control for UI
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle()

    const isAllowed = profile?.is_super_admin || !!subscription

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
                            <Button asChild className="w-full sm:w-auto">
                                <Link href="/communities/create">Create Community</Link>
                            </Button>
                        ) : (
                            <Button asChild variant="default" className="w-full sm:w-auto">
                                <Link href="/subscribe">Subscribe to Create</Link>
                            </Button>
                        )}
                    </div>

                    {communities.length === 0 ? (
                        <Card className="text-center py-12 border-dashed">
                            <CardHeader>
                                <CardTitle>No communities yet</CardTitle>
                                <CardDescription>
                                    You haven&apos;t joined or created any communities yet.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isAllowed ? (
                                    <Button asChild>
                                        <Link href="/communities/create">Create your first community</Link>
                                    </Button>
                                ) : (
                                    <Button asChild variant="default">
                                        <Link href="/subscribe">Subscribe to Create</Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {communities.map((community) => (
                                <Link key={community.id} href={`/communities/${community.slug}`}>
                                    <Card className="h-full hover:bg-muted/50 transition-all hover:shadow-md cursor-pointer group">
                                        <CardHeader>
                                            <CardTitle className="group-hover:text-primary transition-colors">{community.name}</CardTitle>
                                            <CardDescription className="line-clamp-2">{community.description}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
