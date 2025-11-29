'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
    const supabase = await createClient()

    const content = formData.get('content') as string
    const channelId = formData.get('channelId') as string
    const communitySlug = formData.get('communitySlug') as string
    const channelSlug = formData.get('channelSlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to post.' }
    }

    const { error } = await supabase.from('posts').insert({
        content,
        channel_id: channelId,
        user_id: user.id,
    })

    if (error) {
        return { error: 'Failed to create post.' }
    }

    revalidatePath(`/communities/${communitySlug}/${channelSlug}`)
}
