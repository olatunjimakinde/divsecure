import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, Trash2, Car } from 'lucide-react'
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
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-yellow-600"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Account Pending Approval</h1>
                <p className="text-muted-foreground max-w-md">
                    Your account is currently waiting for approval from the community manager.
                    You will be able to generate visitor codes once your account is approved.
                </p>
                <Button variant="outline" asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Visitors</h1>
                    <p className="text-muted-foreground">
                        Manage access codes and view entry history.
                    </p>
                </div>
                <Button asChild>
                    <Link href={`/communities/${slug}/visitors/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Code
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active">Active Codes</TabsTrigger>
                    <TabsTrigger value="history">Entry History</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {codes?.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardHeader>
                                <CardTitle>No active codes</CardTitle>
                                <CardDescription>
                                    You haven&apos;t generated any visitor codes yet.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild variant="outline">
                                    <Link href={`/communities/${slug}/visitors/new`}>
                                        Generate your first code
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <VisitorList codes={codes || []} communitySlug={slug} />
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Entry History</CardTitle>
                            <CardDescription>
                                View when your visitors arrived.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <VisitorHistoryList communityId={community.id} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
