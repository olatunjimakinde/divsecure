import { createAdminClient } from '@/lib/supabase/server'

export type NotificationType = 'visitor_arrival' | 'announcement' | 'security_alert'

export async function sendNotification(
    userId: string,
    communityId: string,
    type: NotificationType,
    message: string
) {
    const supabaseAdmin = await createAdminClient()

    // 1. Check Preference
    // Default is TRUE if no record exists.
    // So we only skip if we find a record with enabled = false.
    const { data: preference } = await supabaseAdmin
        .from('notification_preferences' as any)
        .select('enabled')
        .eq('user_id', userId)
        .eq('community_id', communityId)
        .eq('type', type)
        .single()

    if (preference && (preference as any).enabled === false) {
        console.log(`Notification skipped for user ${userId} type ${type} due to preference.`)
        return { skipped: true }
    }

    // 2. Create Notification
    const { error } = await supabaseAdmin
        .from('notifications' as any)
        .insert({
            user_id: userId,
            type,
            message,
            read: false
        })

    if (error) {
        console.error('Error sending notification:', error)
        return { error }
    }

    return { success: true }
}
