'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCommunity(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const address = formData.get('address') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check access control
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle()

    const isAllowed = profile?.is_super_admin || !!subscription

    if (!isAllowed) {
        return { error: 'You must be a subscriber or admin to create a community.' }
    }

    // 1. Create the community
    const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert({
            name,
            slug,
            description,
            address,
            owner_id: user.id,
        })
        .select()
        .single()

    if (communityError) {
        if (communityError.code === '23505') {
            // Unique violation for slug
            return { error: 'Slug is already taken. Please choose another one.' }
        }
        return { error: 'Failed to create community.' }
    }

    // 2. Add the owner as an admin member
    const { error: memberError } = await supabase.from('members').insert({
        community_id: community.id,
        user_id: user.id,
        role: 'community_manager',
    })

    if (memberError) {
        // If member creation fails, we might want to delete the community or just log it.
        // For now, we'll return an error but the community exists.
        // Ideally, this should be a transaction, but Supabase HTTP API doesn't support transactions easily without RPC.
        return { error: 'Community created but failed to join as admin.' }
    }

    revalidatePath('/dashboard')
    redirect(`/communities/${slug}`)
}
