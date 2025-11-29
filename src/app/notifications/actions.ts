'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markNotificationAsRead(notificationId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

    if (error) {
        console.error('Error marking notification as read:', error)
        return { error: 'Failed to mark as read' }
    }

    revalidatePath('/')
    return { success: true }
}

export async function markAllNotificationsAsRead() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)

    if (error) {
        console.error('Error marking all notifications as read:', error)
        return { error: 'Failed to mark all as read' }
    }

    revalidatePath('/')
    return { success: true }
}
