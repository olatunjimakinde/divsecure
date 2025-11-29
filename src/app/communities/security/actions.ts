'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Guard Management ---

export async function createGuard(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const communityId = formData.get('communityId') as string
    const communitySlug = formData.get('communitySlug') as string
    const isHead = formData.get('isHead') === 'on'

    // 1. Check permissions (Manager or Head of Security)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: currentUserMember } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single()

    if (!currentUserMember || !['community_manager', 'head_of_security'].includes(currentUserMember.role)) {
        return { error: 'Unauthorized' }
    }

    // 1.5 Check if Head of Security already exists if creating one
    if (isHead) {
        const { data: existingHead } = await supabaseAdmin
            .from('members')
            .select('id')
            .eq('community_id', communityId)
            .eq('role', 'head_of_security')
            .single()

        if (existingHead) {
            return { error: 'A Head of Security already exists for this community.' }
        }
    }

    // 2. Create User Directly
    let userId = ''
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
    })

    console.log('Create Guard Result:', {
        success: !createError,
        userId: userData?.user?.id,
        email: email,
        confirmed_at: userData?.user?.confirmed_at,
        email_confirmed_at: userData?.user?.email_confirmed_at
    })

    if (createError) {
        // Check if user already exists
        if (createError.message.includes('already registered') || createError.status === 422) {
            // Try to find the user
            // We can't search by email directly with admin client easily without listUsers which is expensive or restricted?
            // Actually listUsers supports filtering by email? No, not easily in v2?
            // But we can try to invite them? Or just assume we can't get the ID easily if we don't have it.
            // Wait, we can use `listUsers` with filter?
            // Or we can try to get user by email if we had a way.
            // Actually, if they exist, we might want to tell the manager "User already exists".
            // But if we want to support adding existing users, we need their ID.

            // Let's try to fetch the profile by email if possible? 
            // Profiles table is public read? No.
            // Admin client can read profiles.
            const { data: existingProfile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single()

            if (existingProfile) {
                userId = existingProfile.id

                // Update password for existing user to ensure they can login with new credentials
                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                    userId,
                    { password: password, email_confirm: true }
                )

                if (updateError) {
                    console.error('Failed to update password for existing user:', updateError)
                    return { error: 'User exists but failed to update password: ' + updateError.message }
                }

                // Verify the update
                const { data: { user: updatedUser }, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
                console.log('Updated Existing User State:', {
                    id: updatedUser?.id,
                    email: updatedUser?.email,
                    confirmed_at: updatedUser?.confirmed_at,
                    email_confirmed_at: updatedUser?.email_confirmed_at,
                    banned_until: (updatedUser as any)?.banned_until,
                    app_metadata: updatedUser?.app_metadata,
                    fetchError
                })

                // Verify login immediately
                const verifyClient = await createClient()
                const { error: verifyLoginError } = await verifyClient.auth.signInWithPassword({
                    email,
                    password
                })

                console.log('Immediate Login Verification:', {
                    success: !verifyLoginError,
                    error: verifyLoginError
                })

            } else {
                console.error('Create user error:', createError)
                return { error: 'User already exists but could not be found. Please contact support.' }
            }
        } else {
            console.error('Create user error:', createError)
            return { error: createError.message }
        }
    } else {
        userId = userData.user.id
    }

    // 3. Add to Members as Guard
    // Check if already a member
    const { data: existingMember } = await supabaseAdmin
        .from('members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single()

    if (existingMember) {
        return { error: 'User is already a member of this community.' }
    }

    const { error: memberError } = await supabaseAdmin
        .from('members')
        .insert({
            community_id: communityId,
            user_id: userId,
            role: isHead ? 'head_of_security' : 'guard',
            status: 'approved'
        })

    if (memberError) {
        console.error('Member creation error:', memberError)
        return { error: `Failed to add guard: ${memberError.message} (${memberError.details})` }
    }

    revalidatePath(`/communities/${communitySlug}/manager/security`)
    return { success: true }
}

export async function updateGuard(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string
    const fullName = formData.get('fullName') as string
    const isHead = formData.get('isHead') === 'on'
    const role = isHead ? 'head_of_security' : 'guard'

    // 1. Get Member to find User ID and Community ID
    const { data: member } = await supabaseAdmin
        .from('members')
        .select('user_id, community_id')
        .eq('id', memberId)
        .single()

    if (!member) return { error: 'Member not found' }

    // 2. Check Permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: currentUserMember } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', member.community_id)
        .eq('user_id', user.id)
        .single()

    if (!currentUserMember || !['community_manager', 'head_of_security'].includes(currentUserMember.role)) {
        return { error: 'Unauthorized' }
    }

    // 3. Update Profile Name
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', member.user_id)

    if (profileError) {
        console.error('Update profile error:', profileError)
        return { error: 'Failed to update profile' }
    }

    // 4. Update Member Role
    const { error: memberError } = await supabaseAdmin
        .from('members')
        .update({ role: role })
        .eq('id', memberId)

    if (memberError) {
        console.error('Update member error:', memberError)
        return { error: 'Failed to update member role' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/security`)
    return { success: true }
}

export async function toggleGuardStatus(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string
    const currentStatus = formData.get('currentStatus') as string
    const targetStatus = currentStatus === 'approved' ? 'rejected' : 'approved'

    // 1. Get Member to find Community ID
    const { data: member } = await supabaseAdmin
        .from('members')
        .select('community_id')
        .eq('id', memberId)
        .single()

    if (!member) return { error: 'Member not found' }

    // 2. Check Permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: currentUserMember } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', member.community_id)
        .eq('user_id', user.id)
        .single()

    if (!currentUserMember || !['community_manager', 'head_of_security'].includes(currentUserMember.role)) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabaseAdmin
        .from('members')
        .update({ status: targetStatus })
        .eq('id', memberId)

    if (error) return { error: 'Failed to update status' }

    revalidatePath(`/communities/${communitySlug}/manager/security`)
    return { success: true }
}

export async function promoteToHead(formData: FormData) {
    const supabase = await createClient()
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string

    const { error } = await supabase
        .from('members')
        .update({ role: 'head_of_security' })
        .eq('id', memberId)

    // Check if Head of Security already exists
    const { data: member } = await supabase
        .from('members')
        .select('community_id')
        .eq('id', memberId)
        .single()

    if (member) {
        const { data: existingHead } = await supabase
            .from('members')
            .select('id')
            .eq('community_id', member.community_id)
            .eq('role', 'head_of_security')
            .neq('id', memberId) // Exclude self if already head (idempotency)
            .single()

        if (existingHead) {
            return { error: 'A Head of Security already exists.' }
        }
    }

    if (error) return { error: 'Failed to promote' }

    revalidatePath(`/communities/${communitySlug}/manager/security`)
    return { success: true }
}

export async function demoteToGuard(formData: FormData) {
    const supabase = await createClient()
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string

    const { error } = await supabase
        .from('members')
        .update({ role: 'guard' })
        .eq('id', memberId)

    if (error) return { error: 'Failed to demote' }

    revalidatePath(`/communities/${communitySlug}/manager/security`)
    return { success: true }
}

export async function deleteGuard(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string

    // 1. Get Member to find User ID and Community ID
    const { data: member } = await supabaseAdmin
        .from('members')
        .select('user_id, community_id')
        .eq('id', memberId)
        .single()

    if (!member) return { error: 'Member not found' }

    // 2. Check Permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: currentUserMember } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', member.community_id)
        .eq('user_id', user.id)
        .single()

    if (!currentUserMember || !['community_manager', 'head_of_security'].includes(currentUserMember.role)) {
        return { error: 'Unauthorized' }
    }

    // Prevent self-deletion
    if (member.user_id === user.id) {
        return { error: 'You cannot delete yourself.' }
    }

    // 3. Delete from Members
    const { error: deleteMemberError } = await supabaseAdmin
        .from('members')
        .delete()
        .eq('id', memberId)

    if (deleteMemberError) {
        console.error('Delete member error:', deleteMemberError)
        return { error: 'Failed to delete member' }
    }

    // 4. Delete Auth User
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(member.user_id)

    if (deleteUserError) {
        console.error('Delete auth user error:', deleteUserError)
    }

    revalidatePath(`/communities/${communitySlug}/manager/security`)
    return { success: true }
}


// --- Shift Management ---

export async function createShift(formData: FormData) {
    const supabase = await createClient()
    const communityId = formData.get('communityId') as string
    const communitySlug = formData.get('communitySlug') as string
    const guardId = formData.get('guardId') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string

    const { error } = await supabase
        .from('shifts')
        .insert({
            community_id: communityId,
            guard_id: guardId,
            start_time: startTime,
            end_time: endTime,
            status: 'scheduled'
        })

    if (error) {
        console.error('Create shift error:', error)
        return { error: 'Failed to create shift' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/security`)
    return { success: true }
}

export async function deleteShift(formData: FormData) {
    const supabase = await createClient()
    const shiftId = formData.get('shiftId') as string
    const communitySlug = formData.get('communitySlug') as string

    const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId)

    if (error) return { error: 'Failed to delete shift' }

    revalidatePath(`/communities/${communitySlug}/manager/security`)
    return { success: true }
}

// --- Visitor Verification ---

export async function verifyVisitorCode(formData: FormData) {
    const supabase = await createClient()
    const accessCode = formData.get('accessCode') as string
    const communitySlug = formData.get('communitySlug') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized', success: false }

    console.log('Verifying code:', accessCode, 'for slug:', communitySlug)

    // Get Community ID
    const { data: community } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', communitySlug)
        .single()

    if (!community) return { error: 'Community not found' }

    // Find Code
    const { data: code } = await supabase
        .from('visitor_codes')
        .select('*')
        .eq('community_id', community.id)
        .eq('access_code', accessCode)
        .single()

    if (!code) {
        console.log('Code not found')
        return { error: 'Invalid access code', success: false }
    }

    console.log('Found code:', code)

    // Check Status
    if (!code.is_active) {
        return { error: 'Code is suspended', success: false, visitorName: code.visitor_name }
    }

    const now = new Date()
    const validFrom = new Date(code.valid_from)
    const validUntil = new Date(code.valid_until)

    console.log('Time check:', {
        now: now.toISOString(),
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
        isBefore: now < validFrom,
        isAfter: now > validUntil
    })

    if (now < validFrom) {
        return { error: 'Code not yet active', success: false, visitorName: code.visitor_name }
    }

    if (now > validUntil) {
        return { error: 'Code expired', success: false, visitorName: code.visitor_name }
    }

    if (code.is_one_time && code.used_at) {
        return { error: 'One-time code already used', success: false, visitorName: code.visitor_name }
    }

    // Log Entry
    const { error: logError } = await supabase
        .from('visitor_logs')
        .insert({
            community_id: community.id,
            visitor_code_id: code.id,
            entered_at: now.toISOString(),
            entry_point: 'Main Gate',
            guard_id: user.id
        })

    if (logError) {
        console.error('Error logging visitor entry:', logError)
        return { error: 'Failed to log entry', success: false }
    } else {
        // Send Notification to Host
        // We need to import sendNotification dynamically or at top level. 
        // Since this is a server action, top level is fine.
        // But I need to add the import statement first.
        // For now I will add the call here and then add the import.
        try {
            const { sendNotification } = await import('@/lib/notifications')
            await sendNotification(
                code.host_id,
                community.id,
                'visitor_arrival',
                `Your visitor ${code.visitor_name} has arrived at the Main Gate.`
            )
        } catch (e) {
            console.error('Error triggering notification:', e)
        }
    }

    // Mark as Used if One-Time
    const codeData = code as any
    if (code.is_one_time) {
        await supabase
            .from('visitor_codes')
            .update({ used_at: now.toISOString() })
            .eq('id', code.id)
    } else if (codeData.max_uses) {
        // Check usage limit
        if (codeData.usage_count >= codeData.max_uses) {
            return { error: 'Usage limit reached', success: false, visitorName: code.visitor_name }
        }

        // Increment usage count
        await supabase
            .from('visitor_codes')
            .update({ usage_count: codeData.usage_count + 1 } as any)
            .eq('id', code.id)
    } else {
        // Unlimited uses, just track count
        await supabase
            .from('visitor_codes')
            .update({ usage_count: codeData.usage_count + 1 } as any)
            .eq('id', code.id)
    }

    return {
        success: true,
        visitorName: code.visitor_name,
        message: 'Entry authorized'
    }
}
