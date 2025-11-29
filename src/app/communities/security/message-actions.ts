'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessageToManager(formData: FormData) {
    const supabase = await createClient()
    const communitySlug = formData.get('communitySlug') as string
    const subject = formData.get('subject') as string
    const content = formData.get('content') as string

    // Get Community ID
    const { data: community } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', communitySlug)
        .single()

    if (!community) return { error: 'Community not found' }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('security_messages' as any)
        .insert({
            community_id: community.id,
            sender_id: user.id,
            subject,
            content
        })

    if (error) {
        console.error('Send message error:', error)
        return { error: 'Failed to send message' }
    }

    revalidatePath(`/communities/${communitySlug}/security`)
    return { success: true }
}
