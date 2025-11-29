'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateNotificationPreference(
    communityId: string,
    type: string,
    enabled: boolean
) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('notification_preferences' as any)
        .upsert({
            user_id: user.id,
            community_id: communityId,
            type,
            enabled,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,community_id,type'
        })

    if (error) {
        console.error('Error updating preference:', error)
        return { error: 'Failed to update preference' }
    }

    revalidatePath('/communities/[slug]/profile/notifications')
    return { success: true }
}
