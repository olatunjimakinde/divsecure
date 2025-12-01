'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addManager(communityId: string, email: string) {
    const supabase = await createClient()

    // Check if user exists
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

    if (!userProfile) {
        return { error: 'User with this email does not exist.' }
    }

    // Check if already a member
    const { data: existingMember } = await supabase
        .from('members')
        .select('id, role')
        .eq('community_id', communityId)
        .eq('user_id', userProfile.id)
        .single()

    if (existingMember) {
        if (existingMember.role === 'community_manager') {
            return { error: 'User is already a manager.' }
        }

        // Update role to manager
        const { error } = await supabase
            .from('members')
            .update({ role: 'community_manager', status: 'approved' })
            .eq('id', existingMember.id)

        if (error) return { error: error.message }
    } else {
        // Create new member as manager
        const { error } = await supabase
            .from('members')
            .insert({
                community_id: communityId,
                user_id: userProfile.id,
                role: 'community_manager',
                status: 'approved'
            })

        if (error) return { error: error.message }
    }

    revalidatePath(`/admin/communities/${communityId}/members`)
    return { success: true }
}

export async function removeManager(communityId: string, userId: string) {
    const supabase = await createClient()

    // We don't delete the member, just downgrade to resident or remove?
    // Let's remove them for now to be safe, or just change role.
    // Requirement says "CRUD on managers". 
    // Let's delete the member record to completely remove access.

    const { error } = await supabase
        .from('members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .eq('role', 'community_manager')

    if (error) return { error: error.message }

    revalidatePath(`/admin/communities/${communityId}/members`)
    return { success: true }
}
