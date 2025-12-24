import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GlassCard } from '@/components/ui/glass-card'
import { Plus, Trash2, Car, Clock, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { VisitorList } from './visitor-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VisitorHistoryList } from './visitor-history-list'

export default async function VisitorsPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const supabase = await createClient()
    const { slug } = await params

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return null // Middleware handles redirect
    }

    const { data: community } = await supabase
        .from('communities')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!community) {
        notFound()
    }

    const { data: member } = await supabase
        .from('members')
        .select('status')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .single()

    if (member?.status !== 'approved') {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in duration-700">
                <GlassCard className="max-w-md p-8 flex flex-col items-center">
                    <div className="bg-yellow-500/20 p-4 rounded-full mb-4">
                        <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Account Pending Approval</h1>
                    <p className="text-muted-foreground mb-6">
                        Your account is currently waiting for approval from the community manager.
                        You will be able to generate visitor codes once your account is approved.
                    </p>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </GlassCard>
            </div>
        )
    }

    const { data: codes } = await supabase
        .from('visitor_codes')
        .select('*')
        .eq('community_id', community.id)
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })

    const getStatus = (code: any) => {
        const now = new Date()
        const validUntil = new Date(code.valid_until)

        if (code.used_at) return { label: 'Used', variant: 'secondary' as const }
        if (now > validUntil) return { label: 'Expired', variant: 'destructive' as const }
        return { label: 'Active', variant: 'default' as const }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">My Visitors</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage access codes and view entry history.
                    </p>
                </div>
                <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-full px-6">
                    <Link href={`/communities/${slug}/visitors/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Code
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="active" className="space-y-6">
                <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    <TabsList className="inline-flex h-12 w-auto min-w-full justify-start p-1 bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl">
                        <TabsTrigger value="active" className="flex-1 sm:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-lg transition-all duration-300">
                            <Car className="w-4 h-4 mr-2" /> Active Codes
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex-1 sm:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-lg transition-all duration-300">
                            <History className="w-4 h-4 mr-2" /> Entry History
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="active" className="space-y-4 w-full max-w-full outline-none">
                    {codes?.length === 0 ? (
                        <GlassCard className="text-center py-12 sm:py-16 border-dashed border-2 bg-muted/5 hover:bg-muted/10 transition-colors">
                            <div className="mx-auto bg-primary/10 p-5 rounded-full w-20 h-20 flex items-center justify-center mb-6 ring-1 ring-primary/20 shadow-sm">
                                <Car className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No active codes</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-8 px-4">
                                You haven&apos;t generated any visitor codes yet. Create one to allow guest entry.
                            </p>
                            <Button asChild variant="default" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all px-8">
                                <Link href={`/communities/${slug}/visitors/new`}>
                                    Generate your first code
                                </Link>
                            </Button>
                        </GlassCard>
                    ) : (
                        <div className="grid gap-4">
                            <VisitorList codes={codes || []} communitySlug={slug} />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4 w-full max-w-full outline-none">
                    <GlassCard className="border-white/20 dark:border-white/10 shadow-sm">
                        <div className="p-6 border-b border-border/50 pb-6 mb-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold tracking-tight">Entry History</h2>
                                <p className="text-sm text-muted-foreground">
                                    Full log of visitor arrivals.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 pb-6 pt-0">
                            <VisitorHistoryList communityId={community.id} />
                        </div>
                    </GlassCard>
                </TabsContent>
            </Tabs>
        </div>
    )
}
