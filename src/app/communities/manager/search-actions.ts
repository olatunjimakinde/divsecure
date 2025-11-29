'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function searchCommunity(query: string, communityId: string) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    if (!query || query.length < 2) {
        return { residents: [], households: [], guards: [] }
    }

    // Check permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single()

    if (!member || !['community_manager', 'head_of_security'].includes(member.role)) {
        return { error: 'Unauthorized' }
    }

    // Search Residents (Members)
    const { data: residents } = await supabaseAdmin
        .from('members')
        .select(`
            id,
            role,
            status,
            profiles (
                full_name,
                email,
                phone_number
            ),
            households (
                unit_number
            )
        `)
        .eq('community_id', communityId)
        .ilike('profiles.full_name', `%${query}%`)
        .limit(5)

    // Search Households
    const { data: households } = await supabaseAdmin
        .from('households')
        .select('*')
        .eq('community_id', communityId)
        .ilike('unit_number', `%${query}%`)
        .limit(5)

    // Search Guards (Members with role guard/head)
    const { data: guards } = await supabaseAdmin
        .from('members')
        .select(`
            id,
            role,
            status,
            profiles (
                full_name,
                email
            )
        `)
        .eq('community_id', communityId)
        .in('role', ['guard', 'head_of_security'])
        .ilike('profiles.full_name', `%${query}%`)
        .limit(5)

    // Filter residents to exclude guards from resident list if needed, or just return as is
    // The query on profiles is tricky with RLS/joins in Supabase JS client sometimes
    // If the above join filter doesn't work as expected, we might need a different approach
    // But let's try this first. Note: supabase-js doesn't support filtering on joined tables easily with ilike
    // We might need to use !inner join or just search profiles and then filter by member.

    // Alternative: Search profiles first, then find members
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .ilike('full_name', `%${query}%`)
        .limit(20)

    if (!profiles) return { residents: [], households: [], guards: [] }

    const profileIds = profiles.map(p => p.id)

    const { data: members } = await supabaseAdmin
        .from('members')
        .select(`
            id,
            role,
            status,
            user_id,
            households (
                unit_number
            )
        `)
        .eq('community_id', communityId)
        .in('user_id', profileIds)

    // Map back
    const residentsResult = members?.filter(m => ['resident', 'household_head'].includes(m.role)).map(m => {
        const p = profiles.find(p => p.id === m.user_id)
        return { ...m, profiles: p }
    }) || []

    const guardsResult = members?.filter(m => ['guard', 'head_of_security'].includes(m.role)).map(m => {
        const p = profiles.find(p => p.id === m.user_id)
        return { ...m, profiles: p }
    }) || []

    return {
        residents: residentsResult,
        households: households || [],
        guards: guardsResult
    }
}
