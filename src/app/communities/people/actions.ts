'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getURL } from '@/lib/utils'

const inviteSchema = z.object({
    email: z.string().email(),
    fullName: z.string().min(2),
    unitNumber: z.string().min(1),
    communityId: z.string().uuid(),
    communitySlug: z.string().min(1),
})

export async function inviteResident(formData: FormData) {
    const supabase = await createClient()

    // 1. Verify User is Manager/Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const rawData = {
        email: formData.get('email'),
        fullName: formData.get('fullName'),
        unitNumber: formData.get('unitNumber'),
        communityId: formData.get('communityId'),
        communitySlug: formData.get('communitySlug'),
    }

    const validation = inviteSchema.safeParse(rawData)
    if (!validation.success) {
        console.error('Invite Validation Error:', validation.error.issues[0].message)
        return { error: validation.error.issues[0].message }
    }

    const { email, fullName, unitNumber, communityId, communitySlug } = validation.data
    console.log('Inviting resident:', { email, communityId });

    // Check permissions
    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    const isManager = member?.role === 'community_manager'
    const isSuperAdmin = !!profile?.is_super_admin

    if (!isManager && !isSuperAdmin) {
        return { error: 'Unauthorized: Only managers can invite residents' }
    }

    const supabaseAdmin = await createAdminClient()

    // 2. Check if user already exists
    // We can check by trying to get the user by email via admin API or checking profiles
    // It's safer to check profiles as auth.users is restricted
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single()

    let targetUserId: string | null | undefined = existingProfile?.id

    if (targetUserId) {
        // User exists, add them as member
        console.log(`Adding existing user ${targetUserId} to community ${communityId}`)
    } else {
        // User does not exist, invite them
        console.log(`Inviting new user ${email} to community ${communityId}`)

        // ...

        let inviteData: any = null;
        // targetUserId is already declared in outer scope

        const { data: inviteResult, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name: fullName,
            },
            redirectTo: `${getURL()}auth/callback?next=${encodeURIComponent('/communities/' + communitySlug)}`
        })

        if (inviteError) {
            console.error('Invite Error:', inviteError)
            // Fallback for environments where invalid email error occurs (e.g. local/testing)
            if ((inviteError as any).code === 'email_address_invalid' || inviteError.status === 400) {
                console.log('Attempting fallback with generateLink...');
                const { data: linkResult, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'invite',
                    email: email,
                    options: {
                        data: { full_name: fullName },
                        redirectTo: `${getURL()}auth/callback?next=${encodeURIComponent('/communities/' + communitySlug)}`
                    }
                })

                if (linkError) {
                    console.error('Fallback Link Error:', linkError)
                    return { error: 'Failed to send invitation: ' + inviteError?.message }
                }

                // Log likely in dev
                console.log('Fallback Invite Link Generated:', linkResult.properties?.action_link)

                inviteData = linkResult
                targetUserId = linkResult.user?.id || null
            } else {
                return { error: 'Failed to send invitation: ' + inviteError?.message }
            }
        } else {
            inviteData = inviteResult
            targetUserId = inviteResult.user.id
        }

        // Upsert profile for the new user ensuring name is set
        if (targetUserId) {
            await supabaseAdmin.from('profiles').upsert({
                id: targetUserId,
                email: email,
                full_name: fullName,
                status: 'active'
            })
        }
    }

    // 3. Add to members table
    if (!targetUserId) {
        return { error: 'Failed to identify user for invitation' }
    }

    // Check if already a member
    const { data: existingMember } = await supabaseAdmin
        .from('members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', targetUserId)
        .single()

    if (existingMember) {
        return { error: 'User is already a member of this community' }
    }

    const { error: memberError } = await supabaseAdmin
        .from('members')
        .insert({
            community_id: communityId,
            user_id: targetUserId,
            role: 'resident',
            unit_number: unitNumber,
            status: 'approved', // Auto-approve invited residents
            is_household_head: true // Default to head, they can change later
        })

    if (memberError) {
        console.error('Member Insert Error:', memberError)
        return { error: 'Failed to add member to community' }
    }

    revalidatePath(`/communities/${communitySlug}/people`)
    return { success: true }
}

export async function removeResident(formData: FormData) {
    const supabase = await createClient()

    // 1. Verify User is Manager/Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const communitySlug = formData.get('communitySlug') as string
    const memberId = formData.get('memberId') as string

    if (!memberId || !communitySlug) return { error: 'Missing requirements' }

    // Check permissions
    // We need to fetch communityId from slug first to verify role efficiently? 
    // Or just fetch member record and check its community

    // Let's do a direct check on the member being removed to ensure it belongs to a community managed by current user
    // But first we need the community ID of the member being removed
    const supabaseAdmin = await createAdminClient()

    const { data: targetMember } = await supabaseAdmin
        .from('members')
        .select('community_id')
        .eq('id', memberId)
        .single()

    if (!targetMember) return { error: 'Resident not found' }

    // Verify manager of this community
    const { data: managerMember } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', targetMember.community_id)
        .eq('user_id', user.id)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    const isManager = managerMember?.role === 'community_manager'
    const isSuperAdmin = !!profile?.is_super_admin

    if (!isManager && !isSuperAdmin) {
        return { error: 'Unauthorized' }
    }

    // Soft delete or remove? Schema says status: 'suspended' or 'rejected'. 
    // Or row deletion?
    // Let's use row deletion for now to keep it clean, as "Remove" usually implies that in simple management
    // But user asked to "improve". Soft delete (status='suspended') is better for history.
    // However, if we want them off the list, we might filter them out.
    // Let's update status to 'removed' (if enum allows) or 'suspended' (valid enum).
    // The members table has `status: 'pending' | 'approved' | 'rejected' | 'suspended'`
    // Let's use 'suspended' to mimic removal without data loss. 
    // Wait, `profiles` has `status: 'removed'`, but `members` has `suspended`.

    // Actually, physically deleting the member record is often cleaner for "removing a resident from a community" 
    // precisely because they might move out.
    // Let's DELETE the member record.

    const { error: deleteError } = await supabaseAdmin
        .from('members')
        .delete()
        .eq('id', memberId)

    if (deleteError) {
        return { error: 'Failed to remove resident' }
    }

    revalidatePath(`/communities/${communitySlug}/people`)
    return { success: true }
}
