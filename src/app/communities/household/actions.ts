'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getURL } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function verifyHouseholdHead(communitySlug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get community ID
    const { data: community } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', communitySlug)
        .single()

    if (!community) return null

    // Get Member and check if head
    const { data: member } = await supabase
        .from('members')
        .select('id, household_id, is_household_head')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .single()

    if (!member || !member.is_household_head || !member.household_id) {
        return null
    }

    return { member, communityId: community.id }
}

export async function suspendResidentByHead(formData: FormData) {
    const supabase = await createClient()
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string

    const headContext = await verifyHouseholdHead(communitySlug)
    if (!headContext) {
        return { error: 'Unauthorized' }
    }

    // Verify target is in same household
    const { data: targetMember } = await supabase
        .from('members')
        .select('household_id')
        .eq('id', memberId)
        .single()

    if (!targetMember || targetMember.household_id !== headContext.member.household_id) {
        return { error: 'Unauthorized: Resident not in your household' }
    }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('members')
        .update({ status: 'suspended' })
        .eq('id', memberId)

    if (error) {
        console.error('Error suspending resident:', error)
        return { error: 'Failed to suspend resident' }
    }

    revalidatePath(`/communities/${communitySlug}/household`)
    return { success: true }
}

export async function reactivateResidentByHead(formData: FormData) {
    const supabase = await createClient()
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string

    const headContext = await verifyHouseholdHead(communitySlug)
    if (!headContext) {
        return { error: 'Unauthorized' }
    }

    // Verify target is in same household
    const { data: targetMember } = await supabase
        .from('members')
        .select('household_id')
        .eq('id', memberId)
        .single()

    if (!targetMember || targetMember.household_id !== headContext.member.household_id) {
        return { error: 'Unauthorized: Resident not in your household' }
    }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('members')
        .update({ status: 'approved' })
        .eq('id', memberId)

    if (error) {
        console.error('Error reactivating resident:', error)
        return { error: 'Failed to reactivate resident' }
    }

    revalidatePath(`/communities/${communitySlug}/household`)
    return { success: true }
}

export async function updateResidentByHead(formData: FormData) {
    const supabase = await createClient()
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string
    const fullName = formData.get('fullName') as string
    // Email cannot be updated directly in auth/profiles easily by another user without admin API and re-verification usually.
    // But we can update the profile name.

    const headContext = await verifyHouseholdHead(communitySlug)
    if (!headContext) {
        return { error: 'Unauthorized' }
    }

    // Verify target is in same household
    const { data: targetMember } = await supabase
        .from('members')
        .select('household_id, user_id')
        .eq('id', memberId)
        .single()

    if (!targetMember || targetMember.household_id !== headContext.member.household_id) {
        return { error: 'Unauthorized: Resident not in your household' }
    }

    const supabaseAdmin = await createAdminClient()

    // Update Profile Name
    if (fullName) {
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', targetMember.user_id)

        if (error) {
            console.error('Error updating resident profile:', error)
            return { error: 'Failed to update resident profile' }
        }
    }

    revalidatePath(`/communities/${communitySlug}/household`)
    return { success: true }
}

export async function removeResidentByHead(formData: FormData) {
    const supabase = await createClient()
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string

    const headContext = await verifyHouseholdHead(communitySlug)
    if (!headContext) {
        return { error: 'Unauthorized' }
    }

    // Verify target is in same household
    const { data: targetMember } = await supabase
        .from('members')
        .select('household_id')
        .eq('id', memberId)
        .single()

    if (!targetMember || targetMember.household_id !== headContext.member.household_id) {
        return { error: 'Unauthorized: Resident not in your household' }
    }

    // Instead of deleting, we just unassign them from household?
    // Or delete the member record entirely?
    // If they are removed from household, they become unassigned resident.
    // User asked to "delete residents".
    // If we delete, they lose access to community entirely.
    // If we unassign, they are just homeless in community.
    // Let's unassign for now, safer. Or maybe delete if they were invited by head?
    // Let's stick to unassigning from household as "removing from household".

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('members')
        .update({ household_id: null, is_household_head: false })
        .eq('id', memberId)

    if (error) {
        console.error('Error removing resident:', error)
        return { error: 'Failed to remove resident' }
    }

    revalidatePath(`/communities/${communitySlug}/household`)
    return { success: true }
}

export async function inviteResidentByHead(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const communitySlug = formData.get('communitySlug') as string

    const headContext = await verifyHouseholdHead(communitySlug)
    if (!headContext) {
        return { error: 'Unauthorized' }
    }

    const supabaseAdmin = await createAdminClient()

    // 1. Check if user exists with this email (by profile)
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

    let userId = profile?.id

    if (!userId) {
        // User doesn't exist. Invite them.
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${getURL()}auth/callback?next=${encodeURIComponent('/update-password')}`
        })

        if (inviteError) {
            console.error('Error inviting user:', inviteError)
            return { error: 'Failed to invite user. Please check the email address.' }
        }

        userId = inviteData.user.id
    }

    // Update profile name if provided
    const fullName = formData.get('fullName') as string
    if (fullName && userId) {
        await supabaseAdmin
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', userId)
    }

    // 2. Check if they are already a member of this community
    const { data: existingMember } = await supabaseAdmin
        .from('members')
        .select('id, household_id')
        .eq('community_id', headContext.communityId)
        .eq('user_id', userId)
        .single()

    if (existingMember) {
        if (existingMember.household_id) {
            return { error: 'User is already in a household in this community.' }
        }

        // Add to household
        const { error } = await supabaseAdmin
            .from('members')
            .update({
                household_id: headContext.member.household_id,
                role: 'resident',
                status: 'approved' // Auto-approve if invited by head
            })
            .eq('id', existingMember.id)

        if (error) {
            console.error('Error adding member to household:', error)
            return { error: 'Failed to add member to household' }
        }
    } else {
        // Create new member record
        const { error } = await supabaseAdmin
            .from('members')
            .insert({
                community_id: headContext.communityId,
                user_id: userId,
                role: 'resident',
                status: 'approved',
                household_id: headContext.member.household_id
            })

        if (error) {
            console.error('Error creating member:', error)
            return { error: 'Failed to invite member' }
        }
    }

    revalidatePath(`/communities/${communitySlug}/household`)
    return { success: true }
}
