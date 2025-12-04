'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createChannelCore(supabase: any, data: { name: string, slug: string, communityId: string, audience: string, allowReplies: boolean }) {
    const { error } = await supabase.from('channels').insert({
        name: data.name,
        slug: data.slug,
        community_id: data.communityId,
        audience: data.audience,
        allow_replies: data.allowReplies,
    } as any)

    if (error) {
        if (error.code === '23505') {
            return { error: 'Channel slug already exists in this community.' }
        }
        return { error: 'Failed to create channel.' }
    }
    return { success: true }
}

export async function createChannel(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const communityId = formData.get('communityId') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user is owner or manager
    const { data: community } = await supabase
        .from('communities')
        .select('owner_id')
        .eq('id', communityId)
        .single()

    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single()

    const isOwner = community?.owner_id === user.id
    const isManager = member?.role === 'community_manager'

    if (!isOwner && !isManager) {
        return { error: 'You must be a community manager to manage message boards.' }
    }

    const audience = formData.get('audience') as string
    const allowReplies = formData.get('allowReplies') === 'on'

    const result = await createChannelCore(supabase, {
        name,
        slug,
        communityId,
        audience,
        allowReplies
    })

    if (result.error) {
        return result
    }

    revalidatePath(`/communities/${communitySlug}`)
    redirect(`/communities/${communitySlug}/${slug}`)
}

export async function updateChannel(formData: FormData) {
    const supabase = await createClient()

    const channelId = formData.get('channelId') as string
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const communityId = formData.get('communityId') as string
    const communitySlug = formData.get('communitySlug') as string
    const audience = formData.get('audience') as string
    const allowReplies = formData.get('allowReplies') === 'on'

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check permissions
    const { data: community } = await supabase
        .from('communities')
        .select('owner_id')
        .eq('id', communityId)
        .single()

    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single()

    const isOwner = community?.owner_id === user.id
    const isManager = member?.role === 'community_manager'

    if (!isOwner && !isManager) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('channels')
        .update({
            name,
            slug,
            audience,
            allow_replies: allowReplies,
        } as any)
        .eq('id', channelId)

    if (error) {
        if (error.code === '23505') {
            return { error: 'Channel slug already exists.' }
        }
        return { error: 'Failed to update channel.' }
    }

    revalidatePath(`/communities/${communitySlug}`)
    revalidatePath(`/communities/${communitySlug}/${slug}`)
    redirect(`/communities/${communitySlug}/${slug}`)
}

export async function deleteChannel(formData: FormData) {
    const supabase = await createClient()

    const channelId = formData.get('channelId') as string
    const communityId = formData.get('communityId') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check permissions
    const { data: community } = await supabase
        .from('communities')
        .select('owner_id')
        .eq('id', communityId)
        .single()

    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single()

    const isOwner = community?.owner_id === user.id
    const isManager = member?.role === 'community_manager'

    if (!isOwner && !isManager) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId)

    if (error) {
        return { error: 'Failed to delete channel.' }
    }

    revalidatePath(`/communities/${communitySlug}`)
    redirect(`/communities/${communitySlug}`)
}
