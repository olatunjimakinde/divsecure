'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient() // Use admin to ensure we can look up recipients if needed

    const subject = formData.get('subject') as string
    const content = formData.get('content') as string
    const recipientType = formData.get('recipientType') as string // 'individual' or 'group'
    const recipientId = formData.get('recipientId') as string | null
    const recipientGroup = formData.get('recipientGroup') as string | null
    const communityId = formData.get('communityId') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    if (!subject || !content || !communityId) {
        return { error: 'Missing required fields' }
    }

    const messageData: any = {
        community_id: communityId,
        sender_id: user.id,
        subject,
        content,
    }

    if (recipientType === 'individual' && recipientId) {
        messageData.recipient_id = recipientId
    } else if (recipientType === 'group' && recipientGroup) {
        messageData.recipient_group = recipientGroup
    } else {
        return { error: 'Invalid recipient' }
    }

    const { error } = await supabase
        .from('security_messages')
        .insert(messageData)

    if (error) {
        console.error('Error sending message:', error)
        return { error: `Failed to send message: ${error.message} (${error.code})` }
    }

    revalidatePath(`/communities/${communitySlug}/security`)
    return { success: true }
}

export async function markMessageAsRead(messageId: string, communitySlug: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('security_messages')
        .update({ is_read: true })
        .eq('id', messageId)

    if (error) {
        console.error('Error marking message as read:', error)
        return { error: 'Failed to update message' }
    }

    revalidatePath(`/communities/${communitySlug}/security`)
    return { success: true }
}
