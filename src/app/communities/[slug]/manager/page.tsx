import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GlassCard } from '@/components/ui/glass-card'
import { ResidentsList } from './residents-list'
import { GuardsList } from './guards-list'
import { HouseholdList } from './households/household-list'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { SearchInput } from '@/components/search-input'
import { VisitorLogsList } from './visitors/visitor-logs-list'
import { GlobalSearch } from '../../manager/global-search'
import { InviteResidentDialog } from './invite-resident-dialog'
import { Users, Shield, Home, FileText } from 'lucide-react'

export default async function ManagerDashboardPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ query?: string }>
}) {
    const supabase = await createClient()
    const { slug } = await params
    const { query } = await searchParams

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify manager role
    const { data: community } = await supabase
        .from('communities')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!community) {
        redirect('/dashboard')
    }

    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    const isSuperAdmin = !!profile?.is_super_admin
    const isManager = member?.role === 'community_manager'

    if (!isManager && !isSuperAdmin) {
        redirect(`/communities/${slug}`)
    }

    // Fetch households with members and their profiles
    const { data: households, error: householdsError } = await supabase
        .from('households')
        .select(`
            *,
            members:members(
                id,
                user_id,
                is_household_head,
                profiles:profiles(full_name, email)
            )
        `)
        .eq('community_id', community.id)
        .order('name')

    if (householdsError) {
        console.error('Error fetching households:', householdsError)
    }

    // Fetch unassigned residents
    const { data: unassignedMembers, error: membersError } = await supabase
        .from('members')
        .select(`
            id,
            user_id,
            profiles:profiles(full_name, email)
        `)
        .eq('community_id', community.id)
        .eq('role', 'resident')
        .is('household_id', null)
        .order('created_at', { ascending: false })

    if (membersError) {
        console.error('Error fetching unassigned members:', membersError)
    }

    // Transform data
    const formattedHouseholds = households?.map(h => ({
        ...h,
        member_count: h.members?.length || 0,
        members: h.members?.map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            name: m.profiles?.full_name || 'Unknown',
            email: m.profiles?.email || 'No email',
            is_household_head: m.is_household_head
        })) || []
    })) || []

    const formattedUnassigned = unassignedMembers?.map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        name: m.profiles?.full_name || 'Unknown',
        email: m.profiles?.email || 'No email',
        is_household_head: false // Unassigned members cannot be heads
    })) || []

    // Filter households if search query exists (client-side filtering for now as structure is complex)
    // Or we can filter in the query if we change the query structure.
    // For households, we want to search by name or contact email.

    let filteredHouseholds = formattedHouseholds
    if (query) {
        const lowerQuery = query.toLowerCase()
        filteredHouseholds = formattedHouseholds.filter(h =>
            h.name.toLowerCase().includes(lowerQuery) ||
            (h.contact_email && h.contact_email.toLowerCase().includes(lowerQuery))
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Manager Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Overview of <span className="font-medium text-foreground">{community.name}</span> residents and operations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <GlobalSearch communityId={community.id} communitySlug={slug} />
                </div>
            </div>

            <Tabs defaultValue="residents" className="space-y-6">
                <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    <TabsList className="inline-flex h-auto w-auto min-w-full justify-start p-1 bg-transparent border-0 gap-2">
                        <TabsTrigger
                            value="residents"
                            className="flex-1 sm:flex-none rounded-full border border-border/50 bg-background/50 hover:bg-background/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all duration-300 px-4 py-2.5 h-auto text-sm font-medium shadow-sm"
                        >
                            <Users className="w-4 h-4 mr-2" /> Residents
                        </TabsTrigger>
                        <TabsTrigger
                            value="guards"
                            className="flex-1 sm:flex-none rounded-full border border-border/50 bg-background/50 hover:bg-background/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all duration-300 px-4 py-2.5 h-auto text-sm font-medium shadow-sm"
                        >
                            <Shield className="w-4 h-4 mr-2" /> Security
                        </TabsTrigger>
                        <TabsTrigger
                            value="households"
                            className="flex-1 sm:flex-none rounded-full border border-border/50 bg-background/50 hover:bg-background/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all duration-300 px-4 py-2.5 h-auto text-sm font-medium shadow-sm"
                        >
                            <Home className="w-4 h-4 mr-2" /> Households
                        </TabsTrigger>
                        <TabsTrigger
                            value="visitors"
                            className="flex-1 sm:flex-none rounded-full border border-border/50 bg-background/50 hover:bg-background/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all duration-300 px-4 py-2.5 h-auto text-sm font-medium shadow-sm"
                        >
                            <FileText className="w-4 h-4 mr-2" /> Logs
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="residents" className="space-y-4 animate-in zoom-in-95 duration-500 w-full max-w-full outline-none">
                    <GlassCard className="border-white/20 dark:border-white/10 shadow-sm">
                        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6 mb-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold tracking-tight">Residents Directory</h2>
                                <p className="text-sm text-muted-foreground">
                                    Manage resident access, roles, and approvals.
                                </p>
                            </div>
                            <InviteResidentDialog communityId={community.id} communitySlug={slug} households={households || []} />
                        </div>
                        <div className="px-6 pb-6 pt-0">
                            <ResidentsList communityId={community.id} communitySlug={slug} searchQuery={query} />
                        </div>
                    </GlassCard>
                </TabsContent>

                <TabsContent value="guards" className="space-y-4 animate-in zoom-in-95 duration-500 w-full max-w-full outline-none">
                    <GlassCard className="border-white/20 dark:border-white/10 shadow-sm">
                        <div className="p-6 border-b border-border/50 pb-6 mb-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold tracking-tight">Security Personnel</h2>
                                <p className="text-sm text-muted-foreground">
                                    Manage security guard accounts and station access.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 pb-6 pt-0">
                            <GuardsList communityId={community.id} searchQuery={query} />
                        </div>
                    </GlassCard>
                </TabsContent>

                <TabsContent value="households" className="space-y-4 animate-in zoom-in-95 duration-500 w-full max-w-full outline-none">
                    <GlassCard className="border-white/20 dark:border-white/10 shadow-sm">
                        <div className="p-6 border-b border-border/50 pb-6 mb-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold tracking-tight">Households</h2>
                                <p className="text-sm text-muted-foreground">
                                    Manage physical units and resident assignments.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 pb-6 pt-0">
                            <HouseholdList
                                households={filteredHouseholds}
                                unassignedMembers={formattedUnassigned}
                                communityId={community.id}
                                communitySlug={slug}
                            />
                        </div>
                    </GlassCard>
                </TabsContent>

                <TabsContent value="visitors" className="space-y-4 animate-in zoom-in-95 duration-500 w-full max-w-full outline-none">
                    <GlassCard className="border-white/20 dark:border-white/10 shadow-sm">
                        <div className="p-6 border-b border-border/50 pb-6 mb-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold tracking-tight">Visitor Logs</h2>
                                <p className="text-sm text-muted-foreground">
                                    View full history of visitor entries and exits.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 pb-6 pt-0">
                            <VisitorLogsList communityId={community.id} searchQuery={query} />
                        </div>
                    </GlassCard>
                </TabsContent>
            </Tabs>
        </div>
    )
}
