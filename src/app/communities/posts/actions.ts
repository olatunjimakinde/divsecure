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

export async function updatePost(formData: FormData) {
    const supabase = await createClient()

    const postId = formData.get('postId') as string
    const content = formData.get('content') as string
    const communitySlug = formData.get('communitySlug') as string
    const channelSlug = formData.get('channelSlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Check permissions (Author or Manager)
    // For simplicity, we'll check if the user is the author in the query
    // Ideally we should also check for manager role, but let's start with author

    // First fetch the post to check author
    const { data: post } = await supabase
        .from('posts')
        .select('user_id, channel_id')
        .eq('id', postId)
        .single()

    if (!post) return { error: 'Post not found' }

    let hasPermission = post.user_id === user.id

    if (!hasPermission) {
        // Check if manager
        const { data: channel } = await supabase.from('channels').select('community_id').eq('id', post.channel_id).single()
        if (channel) {
            const { data: member } = await supabase.from('members').select('role').eq('community_id', channel.community_id).eq('user_id', user.id).single()
            if (member?.role === 'community_manager') {
                hasPermission = true
            }
        }
    }

    if (!hasPermission) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('posts')
        .update({ content })
        .eq('id', postId)

    if (error) {
        return { error: 'Failed to update post.' }
    }

    revalidatePath(`/communities/${communitySlug}/${channelSlug}`)
    return { success: true }
}

export async function deletePost(formData: FormData) {
    const supabase = await createClient()

    const postId = formData.get('postId') as string
    const communitySlug = formData.get('communitySlug') as string
    const channelSlug = formData.get('channelSlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Check permissions (Author or Manager)
    const { data: post } = await supabase
        .from('posts')
        .select('user_id, channel_id')
        .eq('id', postId)
        .single()

    if (!post) return { error: 'Post not found' }

    let hasPermission = post.user_id === user.id

    if (!hasPermission) {
        // Check if manager
        const { data: channel } = await supabase.from('channels').select('community_id').eq('id', post.channel_id).single()
        if (channel) {
            const { data: member } = await supabase.from('members').select('role').eq('community_id', channel.community_id).eq('user_id', user.id).single()
            if (member?.role === 'community_manager') {
                hasPermission = true
            }
        }
    }

    if (!hasPermission) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

    if (error) {
        return { error: 'Failed to delete post.' }
    }

    revalidatePath(`/communities/${communitySlug}/${channelSlug}`)
    return { success: true }
}
