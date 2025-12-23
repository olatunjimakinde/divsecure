'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getURL } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendInvitationEmail } from '@/lib/email'

export async function createHousehold(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const name = formData.get('name') as string
    const contactEmail = formData.get('contactEmail') as string
    const communitySlug = formData.get('communitySlug') as string
    const communityId = formData.get('communityId') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Create Household
    const { data: household, error } = await supabaseAdmin
        .from('households')
        .insert({
            community_id: communityId,
            name,
            contact_email: contactEmail || null,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating household:', error)
        return { error: 'Failed to create household' }
    }

    // 2. Handle Contact Email (Invite & Assign)
    if (contactEmail) {
        try {
            // Check if user exists by email (using admin listUsers is expensive, better to try getting profile first)
            // But profiles are public usually? Or we can just try to invite.
            // If we try to invite an existing user, it might error or just send an email.
            // Let's try to find a profile first.

            // Actually, we can't easily query auth.users. 
            // We'll assume if we can't find a profile, they are new.
            let userId = null

            const { data: profiles } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', contactEmail)
                .single()

            if (profiles) {
                userId = profiles.id
            } else {
                // Invite User
                const redirectTo = `${getURL()}auth/confirm?next=${encodeURIComponent('/update-password')}`
                console.log('Inviting user with redirectTo:', redirectTo)
                console.log('Checking RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Present' : 'Missing')

                if (process.env.RESEND_API_KEY) {
                    // Manual Link Generation + Resend
                    console.log('RESEND_API_KEY found, using Resend for invite.')
                    console.log('Generating link for:', contactEmail)
                    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                        type: 'invite',
                        email: contactEmail,
                        options: {
                            redirectTo,
                        }
                    })

                    if (linkError) {
                        console.error('Error generating invite link:', linkError)
                    } else if (linkData?.properties?.action_link) {
                        const originalLink = linkData.properties.action_link
                        // Wrap in safe-redirect to prevent email scanners from consuming the token
                        const safeLink = `${getURL()}auth/safe-redirect?target=${encodeURIComponent(originalLink)}`

                        console.log('Link generated successfully. Original:', originalLink.substring(0, 30) + '...')
                        console.log('Sending Safe Link:', safeLink)

                        userId = linkData.user.id
                        // Send Email
                        console.log('Triggering sendInvitationEmail...')
                        await sendInvitationEmail(contactEmail, safeLink, communitySlug)
                        console.log('sendInvitationEmail completed.')
                    }
                } else {
                    // Fallback to Supabase Invite
                    console.log('RESEND_API_KEY missing (Fallback branch entered). calling inviteUserByEmail for:', contactEmail)
                    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(contactEmail, {
                        redirectTo
                    })
                    if (inviteError) {
                        console.error('Error inviting user (Supabase):', inviteError)
                    } else {
                        console.log('Supabase invite sent successfully. User ID:', inviteData.user.id)
                        userId = inviteData.user.id
                    }
                }

                // Fallback: If generateLink worked, we continue.
                // If it failed, userId is null.
            }

            if (userId) {
                // Check if member exists
                const { data: existingMember } = await supabaseAdmin
                    .from('members')
                    .select('id')
                    .eq('community_id', communityId)
                    .eq('user_id', userId)
                    .single()

                if (existingMember) {
                    // Update existing member
                    await supabaseAdmin
                        .from('members')
                        .update({
                            household_id: household.id,
                            is_household_head: true
                        })
                        .eq('id', existingMember.id)
                } else {
                    // Create new member
                    await supabaseAdmin
                        .from('members')
                        .insert({
                            community_id: communityId,
                            user_id: userId,
                            role: 'resident',
                            status: 'approved', // Auto-approve invited household contacts? Yes.
                            household_id: household.id,
                            is_household_head: true
                        })
                }
            }
        } catch (e) {
            console.error('Error handling contact email:', e)
        }
    }

    revalidatePath(`/communities/${communitySlug}/manager/households`)
    return { success: true }
}

export async function bulkCreateHouseholds(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const prefix = formData.get('prefix') as string // e.g. "Unit "
    const start = parseInt(formData.get('start') as string)
    const end = parseInt(formData.get('end') as string)
    const communitySlug = formData.get('communitySlug') as string
    const communityId = formData.get('communityId') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    if (isNaN(start) || isNaN(end) || start > end) {
        return { error: 'Invalid range' }
    }

    if (end - start > 100) {
        return { error: 'Cannot create more than 100 households at once' }
    }

    const households = []
    for (let i = start; i <= end; i++) {
        households.push({
            community_id: communityId,
            name: `${prefix}${i}`,
        })
    }

    const { error } = await supabaseAdmin.from('households').insert(households)

    if (error) {
        console.error('Error bulk creating households:', error)
        return { error: 'Failed to create households' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/households`)
    return { success: true }
}

export async function updateHousehold(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const householdId = formData.get('householdId') as string
    const name = formData.get('name') as string
    const contactEmail = formData.get('contactEmail') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { error } = await supabaseAdmin
        .from('households')
        .update({
            name,
            contact_email: contactEmail || null,
        })
        .eq('id', householdId)

    if (error) {
        console.error('Error updating household:', error)
        return { error: 'Failed to update household' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/households`)
    return { success: true }
}

export async function deleteHousehold(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const householdId = formData.get('householdId') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { error } = await supabaseAdmin
        .from('households')
        .delete()
        .eq('id', householdId)

    if (error) {
        console.error('Error deleting household:', error)
        return { error: 'Failed to delete household' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/households`)
    return { success: true }
}

export async function addMemberToHousehold(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const memberId = formData.get('memberId') as string
    const householdId = formData.get('householdId') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Check Resident Limit
    // Get community settings
    const { data: community } = await supabase
        .from('communities')
        .select('id, max_residents_per_household')
        .eq('slug', communitySlug)
        .single()

    if (!community) return { error: 'Community not found' }

    const maxResidents = community.max_residents_per_household || 4

    // Count current members
    const { count, error: countError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('household_id', householdId)

    if (countError) {
        console.error('Error counting members:', countError)
        return { error: 'Failed to check resident limit' }
    }

    if ((count || 0) >= maxResidents) {
        return { error: `Household is full. Maximum ${maxResidents} residents allowed.` }
    }

    // 2. Add Member
    const { error } = await supabaseAdmin
        .from('members')
        .update({ household_id: householdId })
        .eq('id', memberId)

    if (error) {
        console.error('Error adding member to household:', error)
        return { error: 'Failed to add member to household' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/households`)
    return { success: true }
}



export async function removeMemberFromHousehold(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { error } = await supabaseAdmin
        .from('members')
        .update({ household_id: null, is_household_head: false })
        .eq('id', memberId)

    if (error) {
        console.error('Error removing member from household:', error)
        return { error: 'Failed to remove member from household' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/households`)
    return { success: true }
}

export async function toggleHouseholdHead(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const memberId = formData.get('memberId') as string
    const isHead = formData.get('isHead') === 'true'
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { error } = await supabaseAdmin
        .from('members')
        .update({ is_household_head: isHead })
        .eq('id', memberId)

    if (error) {
        console.error('Error toggling household head:', error)
        return { error: 'Failed to update household head status' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/households`)
    return { success: true }
}

export async function suspendHousehold(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const householdId = formData.get('householdId') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { error } = await supabaseAdmin
        .from('households')
        .update({ status: 'suspended' })
        .eq('id', householdId)

    if (error) {
        console.error('Error suspending household:', error)
        return { error: 'Failed to suspend household' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/households`)
    return { success: true }
}

export async function activateHousehold(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const householdId = formData.get('householdId') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { error } = await supabaseAdmin
        .from('households')
        .update({ status: 'active' })
        .eq('id', householdId)

    if (error) {
        console.error('Error activating household:', error)
        return { error: 'Failed to activate household' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/households`)
    return { success: true }
}

export async function changeHouseholdHeadCore(supabaseAdmin: any, householdId: string, newHeadMemberId: string) {
    // 1. Remove old head(s)
    const { error: removeError } = await supabaseAdmin
        .from('members')
        .update({ is_household_head: false })
        .eq('household_id', householdId)
        .eq('is_household_head', true)

    if (removeError) {
        console.error('Error removing old head:', removeError)
        return { error: 'Failed to update old head' }
    }

    // 2. Set new head
    const { error: setError } = await supabaseAdmin
        .from('members')
        .update({ is_household_head: true })
        .eq('id', newHeadMemberId)
        .eq('household_id', householdId)

    if (setError) {
        console.error('Error setting new head:', setError)
        return { error: 'Failed to set new head' }
    }

    return { success: true }
}

export async function changeHouseholdHead(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const householdId = formData.get('householdId') as string
    const newHeadMemberId = formData.get('newHeadMemberId') as string
    const communitySlug = formData.get('communitySlug') as string
    const communityId = formData.get('communityId') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify Manager (reusing logic or just checking role)
    const { isSuperAdmin } = await import('@/lib/permissions')
    const isSuper = await isSuperAdmin(user.id)

    if (!isSuper) {
        const { data: managerMember } = await supabase
            .from('members')
            .select('role')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .single()

        if (managerMember?.role !== 'community_manager') {
            return { error: 'Unauthorized' }
        }
    }

    const result = await changeHouseholdHeadCore(supabaseAdmin, householdId, newHeadMemberId)
    if (result.error) return result

    revalidatePath(`/communities/${communitySlug}/manager/households`)
    return { success: true }
}

export async function inviteMemberToHouseholdCore(supabaseAdmin: any, communityId: string, householdId: string, email: string) {
    // 1. Check Resident Limit
    // We need a regular client for reading public data? Or admin is fine. Admin is fine.
    const { data: community } = await supabaseAdmin
        .from('communities')
        .select('max_residents_per_household')
        .eq('id', communityId)
        .single()

    const maxResidents = community?.max_residents_per_household || 4

    const { count, error: countError } = await supabaseAdmin
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('household_id', householdId)

    if (countError) {
        console.error('Error counting members:', countError)
        return { error: 'Failed to check resident limit' }
    }

    if ((count || 0) >= maxResidents) {
        return { error: `Household is full. Maximum ${maxResidents} residents allowed.` }
    }

    // 2. Find or Invite User
    let userId = null

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, status')
        .eq('email', email)
        .single()

    if (profile) {
        userId = profile.id
        // Check for soft delete
        if (profile.status === 'removed') {
            const { error: reactivateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    status: 'active',
                    deleted_at: null
                })
                .eq('id', userId)

            if (reactivateError) {
                console.error('Error reactivating user:', reactivateError)
                return { error: 'Failed to reactivate user' }
            }
        }
    } else {
        // Invite User
        const redirectTo = `${getURL()}auth/confirm?next=${encodeURIComponent('/update-password')}`
        console.log('Inviting user with redirectTo:', redirectTo)

        // Generate Link Manually
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email: email,
            options: {
                redirectTo,
            }
        })

        if (linkError) {
            console.error('Error generating invite link:', linkError)
            return { error: 'Failed to invite user.' }
        }

        if (linkData?.properties?.action_link) {
            userId = linkData.user.id
            // Fetch community name for email
            const { data: community } = await supabaseAdmin
                .from('communities')
                .select('name')
                .eq('id', communityId)
                .single()

            await sendInvitationEmail(email, linkData.properties.action_link, community?.name)
        } else {
            return { error: 'Failed to generate invitation link.' }
        }
    }

    // 3. Add/Link to Household
    // Check if they are already a member
    const { data: existingMember } = await supabaseAdmin
        .from('members')
        .select('id, household_id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single()

    if (existingMember) {
        if (existingMember.household_id) {
            return { error: 'User is already in a household in this community.' }
        }

        // Update existing member
        const { error } = await supabaseAdmin
            .from('members')
            .update({
                household_id: householdId,
                role: 'resident',
                status: 'approved'
            })
            .eq('id', existingMember.id)

        if (error) {
            console.error('Error updating member:', error)
            return { error: 'Failed to add member to household' }
        }
    } else {
        // Create new member
        const { error } = await supabaseAdmin
            .from('members')
            .insert({
                community_id: communityId,
                user_id: userId,
                role: 'resident',
                status: 'approved',
                household_id: householdId
            })

        if (error) {
            console.error('Error creating member:', error)
            return { error: 'Failed to add member to household' }
        }
    }

    return { success: true }
}

export async function inviteMemberToHousehold(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const email = formData.get('email') as string
    const householdId = formData.get('householdId') as string
    const communitySlug = formData.get('communitySlug') as string
    const communityId = formData.get('communityId') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify Manager
    const { isSuperAdmin } = await import('@/lib/permissions')
    const isSuper = await isSuperAdmin(user.id)

    if (!isSuper) {
        const { data: managerMember } = await supabase
            .from('members')
            .select('role')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .single()

        if (managerMember?.role !== 'community_manager') {
            return { error: 'Unauthorized' }
        }
    }

    const result = await inviteMemberToHouseholdCore(supabaseAdmin, communityId, householdId, email)
    if (result.error) return result

    revalidatePath(`/communities/${communitySlug}/manager/households`)
    return { success: true }
}
