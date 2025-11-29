import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { HouseholdList } from './household-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function HouseholdsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: community } = await supabase
        .from('communities')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!community) {
        notFound()
    }

    // Verify admin/manager role
    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .single()

    if (!member || member.role !== 'community_manager') {
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
            is_household_head: m.is_household_head || false
        })) || []
    })) || []

    const formattedUnassigned = unassignedMembers?.map((m: any) => ({
        id: m.id,
        name: m.profiles?.full_name || 'Unknown',
        email: m.profiles?.email || 'No email',
        is_household_head: false
    })) || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Households</h1>
                    <p className="text-muted-foreground">
                        Manage physical units and resident assignments.
                    </p>
                </div>
            </div>

            <HouseholdList
                households={formattedHouseholds}
                unassignedMembers={formattedUnassigned}
                communityId={community.id}
                communitySlug={slug}
            />
        </div>
    )
}
