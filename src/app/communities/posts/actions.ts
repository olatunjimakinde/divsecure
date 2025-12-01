'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPostCore(supabase: any, data: { content: string, channelId: string, userId: string }) {
    const { error } = await supabase.from('posts').insert({
        content: data.content,
        channel_id: data.channelId,
        user_id: data.userId,
    })

    if (error) {
        return { error: 'Failed to create post.' }
    }
    return { success: true }
}

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

    const result = await createPostCore(supabase, {
        content,
        channelId,
        userId: user.id
    })

    if (result.error) {
        return result
    }

    revalidatePath(`/communities/${communitySlug}/${channelSlug}`)
}
