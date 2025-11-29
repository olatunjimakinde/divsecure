'use server'

import { createClient } from '@/lib/supabase/server'

export async function getCommunitySubscription(communityId: string) {
    const supabase = await createClient()

    const { data: subscription } = await supabase
        .from('community_subscription_settings' as any)
        .select(`
            *,
            plan:subscription_plans(*)
        `)
        .eq('community_id', communityId)
        .single()

    if (!subscription) {
        // Return default free plan if no subscription found
        // Or handle as "No Plan"
        return null
    }

    return subscription
}

export async function updateSubscriptionStatus(communityId: string, status: string) {
    const supabase = await createClient()

    // Check Super Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles' as any)
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    if (!profile || !(profile as any).is_super_admin) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('community_subscription_settings' as any)
        .update({ status })
        .eq('community_id', communityId)

    if (error) {
        return { error: 'Failed to update status' }
    }

    return { success: true }
}

export async function assignPlanToCommunity(communityId: string, planId: string) {
    const supabase = await createClient()

    // Check Super Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles' as any)
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    if (!profile || !(profile as any).is_super_admin) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('community_subscription_settings' as any)
        .upsert({
            community_id: communityId,
            plan_id: planId,
            status: 'active',
            updated_at: new Date().toISOString()
        })

    if (error) {
        return { error: 'Failed to assign plan' }
    }

    return { success: true }
}
