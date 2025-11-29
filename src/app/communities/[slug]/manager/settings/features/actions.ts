'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateRoleFeature(
    communityId: string,
    role: string,
    featureKey: string,
    enabled: boolean
) {
    const supabase = await createClient()

    // Check Manager Permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify user is manager of this community
    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .in('role', ['community_manager', 'head_of_security'])
        .single()

    if (!member) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('role_features' as any)
        .upsert({
            community_id: communityId,
            role,
            feature_key: featureKey,
            enabled,
            created_at: new Date().toISOString()
        }, {
            onConflict: 'community_id,role,feature_key'
        })

    if (error) {
        console.error('Error updating role feature:', error)
        return { error: 'Failed to update feature' }
    }

    revalidatePath(`/communities/[slug]/manager/settings/features`)
    return { success: true }
}
