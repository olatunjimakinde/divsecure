'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCommunityFeature(
    communityId: string,
    featureKey: string,
    enabled: boolean
) {
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
        .from('community_features' as any)
        .upsert({
            community_id: communityId,
            feature_key: featureKey,
            enabled,
            created_at: new Date().toISOString() // upsert needs all non-nulls if inserting
        }, {
            onConflict: 'community_id,feature_key'
        })

    if (error) {
        console.error('Error updating community feature:', error)
        return { error: 'Failed to update feature' }
    }

    revalidatePath(`/admin/communities/${communityId}/features`)
    return { success: true }
}
