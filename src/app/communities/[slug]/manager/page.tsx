import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResidentsList } from './residents-list'
import { GuardsList } from './guards-list'
import { HouseholdList } from './households/household-list'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { SearchInput } from '@/components/search-input'
import { VisitorLogsList } from './visitors/visitor-logs-list'
import { GlobalSearch } from '../../manager/global-search'

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
            name: m.profiles?.full_name || 'Unknown',
            email: m.profiles?.email || 'No email',
            is_household_head: m.is_household_head
        })) || []
    })) || []

    const formattedUnassigned = unassignedMembers?.map((m: any) => ({
        id: m.id,
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
                    <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage your community residents and security.
                    </p>
                </div>
                <GlobalSearch communityId={community.id} communitySlug={slug} />
            </div>

            <Tabs defaultValue="residents" className="space-y-4">
                <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <TabsList className="inline-flex h-auto w-auto min-w-full justify-start p-1">
                        <TabsTrigger value="residents" className="flex-1 sm:flex-none">Residents</TabsTrigger>
                        <TabsTrigger value="guards" className="flex-1 sm:flex-none">Security Guards</TabsTrigger>
                        <TabsTrigger value="households" className="flex-1 sm:flex-none">Households</TabsTrigger>
                        <TabsTrigger value="visitors" className="flex-1 sm:flex-none">Visitor Logs</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="residents" className="space-y-4 animate-in zoom-in-95 duration-500 w-full max-w-full">
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle>Residents</CardTitle>
                            <CardDescription>
                                Manage resident access and approvals.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <ResidentsList communityId={community.id} communitySlug={slug} searchQuery={query} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="guards" className="space-y-4 animate-in zoom-in-95 duration-500 w-full max-w-full">
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle>Security Guards</CardTitle>
                            <CardDescription>
                                Manage security personnel access.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <GuardsList communityId={community.id} searchQuery={query} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="households" className="space-y-4 animate-in zoom-in-95 duration-500 w-full max-w-full">
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle>Households</CardTitle>
                            <CardDescription>
                                Manage physical units and resident assignments.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <HouseholdList
                                households={filteredHouseholds}
                                unassignedMembers={formattedUnassigned}
                                communityId={community.id}
                                communitySlug={slug}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="visitors" className="space-y-4 animate-in zoom-in-95 duration-500 w-full max-w-full">
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle>Visitor Logs</CardTitle>
                            <CardDescription>
                                View history of visitor entries.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <VisitorLogsList communityId={community.id} searchQuery={query} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
