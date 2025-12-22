'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { safeAction } from '@/lib/safe-action'
import { createGuardSchema, updateGuardSchema, toggleGuardStatusSchema, deleteGuardSchema } from './schemas'

// --- Guard Management ---

export const createGuard = safeAction({
    schema: createGuardSchema,
    action: async (data, user) => {
        const supabaseAdmin = await createAdminClient()

        const { email, password, fullName, communityId, communitySlug, isHead: isHeadRaw } = data
        const isHead = isHeadRaw === 'on'

        // 1. Check permissions (Manager or Head of Security)
        // User is already authenticated by safeAction
        const supabase = await createClient() // Need non-admin for normal queries? Or use the user passed by safeAction?
        // safeAction passes the Auth User object. We need to check role.

        const { data: currentUserMember } = await supabase
            .from('members')
            .select('role')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .single()

        if (!currentUserMember || !['community_manager', 'head_of_security'].includes(currentUserMember.role)) {
            throw new Error('Unauthorized')
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
                throw new Error('A Head of Security already exists for this community.')
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

        if (createError) {
            // Check if user already exists (logic copied from original)
            if (createError.message.includes('already registered') || createError.status === 422) {
                const { data: existingProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('email', email)
                    .single()

                if (existingProfile) {
                    userId = existingProfile.id
                    // Update password
                    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                        userId,
                        { password: password, email_confirm: true }
                    )
                    if (updateError) throw new Error('User exists but failed to update password: ' + updateError.message)
                } else {
                    throw new Error('User already exists but could not be found.')
                }
            } else {
                throw new Error(createError.message)
            }
        } else {
            userId = userData.user.id
        }

        // 3. Add to Members
        const { data: existingMember } = await supabaseAdmin
            .from('members')
            .select('id')
            .eq('community_id', communityId)
            .eq('user_id', userId)
            .single()

        if (existingMember) {
            throw new Error('User is already a member of this community.')
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
            throw new Error(`Failed to add guard: ${memberError.message}`)
        }

        revalidatePath(`/communities/${communitySlug}/manager/security`)
        return { success: true }
    }
})

export const updateGuard = safeAction({
    schema: updateGuardSchema,
    action: async (data, user) => {
        const supabaseAdmin = await createAdminClient()
        const { memberId, communitySlug, fullName, isHead: isHeadRaw } = data
        const isHead = isHeadRaw === 'on'
        const role = isHead ? 'head_of_security' : 'guard'

        const { data: member } = await supabaseAdmin
            .from('members')
            .select('user_id, community_id')
            .eq('id', memberId)
            .single()

        if (!member) throw new Error('Member not found')

        // Prevent self-demotion/role change if needed? 
        // User didn't strictly ask for this, but good practice.
        // Actually, Head Guard might demote themselves accidentally? Let's allow for now as not requested.

        const supabase = await createClient()
        const { data: currentUserMember } = await supabase
            .from('members')
            .select('role')
            .eq('community_id', member.community_id)
            .eq('user_id', user.id)
            .single()

        if (!currentUserMember || !['community_manager', 'head_of_security'].includes(currentUserMember.role)) {
            throw new Error('Unauthorized')
        }

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', member.user_id)

        if (profileError) throw new Error('Failed to update profile')

        const { error: memberError } = await supabaseAdmin
            .from('members')
            .update({ role: role })
            .eq('id', memberId)

        if (memberError) throw new Error('Failed to update member role')

        revalidatePath(`/communities/${communitySlug}/manager/security`)
        return { success: true }
    }
})

export const toggleGuardStatus = safeAction({
    schema: toggleGuardStatusSchema,
    action: async (data, user) => {
        const supabaseAdmin = await createAdminClient()
        const { memberId, communitySlug, currentStatus } = data
        const targetStatus = currentStatus === 'approved' ? 'rejected' : 'approved'

        const { data: member } = await supabaseAdmin
            .from('members')
            .select('community_id, user_id')
            .eq('id', memberId)
            .single()

        if (!member) throw new Error('Member not found')

        console.log('[DEBUG] toggleGuardStatus', { memberUserId: member.user_id, sessionUserId: user.id })

        // Prevent self-suspension
        if (member.user_id === user.id) {
            throw new Error('You cannot suspend yourself.')
        }

        const supabase = await createClient()
        const { data: currentUserMember } = await supabase
            .from('members')
            .select('role')
            .eq('community_id', member.community_id)
            .eq('user_id', user.id)
            .single()

        if (!currentUserMember || !['community_manager', 'head_of_security'].includes(currentUserMember.role)) {
            throw new Error('Unauthorized')
        }

        const { error } = await supabaseAdmin
            .from('members')
            .update({ status: targetStatus })
            .eq('id', memberId)

        if (error) throw new Error('Failed to update status')

        revalidatePath(`/communities/${communitySlug}/manager/security`)
        return { success: true }
    }
})

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

export const deleteGuard = safeAction({
    schema: deleteGuardSchema,
    action: async (data, user) => {
        const supabaseAdmin = await createAdminClient()
        const { memberId, communitySlug } = data

        const { data: member } = await supabaseAdmin
            .from('members')
            .select('user_id, community_id')
            .eq('id', memberId)
            .single()

        if (!member) throw new Error('Member not found')

        console.log('[DEBUG] deleteGuard', { memberUserId: member.user_id, sessionUserId: user.id })

        // Prevent self-deletion
        // This logic existed before, but now we confirm it works within safeAction
        if (member.user_id === user.id) {
            throw new Error('You cannot delete yourself.')
        }

        const supabase = await createClient()
        const { data: currentUserMember } = await supabase
            .from('members')
            .select('role')
            .eq('community_id', member.community_id)
            .eq('user_id', user.id)
            .single()

        if (!currentUserMember || !['community_manager', 'head_of_security'].includes(currentUserMember.role)) {
            throw new Error('Unauthorized')
        }

        const { error: deleteMemberError } = await supabaseAdmin
            .from('members')
            .delete()
            .eq('id', memberId)

        if (deleteMemberError) throw new Error('Failed to delete member')

        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(member.user_id)
        if (deleteUserError) console.error('Delete auth user error:', deleteUserError)

        revalidatePath(`/communities/${communitySlug}/manager/security`)
        return { success: true }
    }
})


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
    const codeData = code as any
    if (!code.is_active) {
        return { error: 'Code is suspended', success: false, visitorName: code.visitor_name }
    }

    const now = new Date()
    const validFrom = new Date(code.valid_from)
    const validUntil = new Date(code.valid_until)

    if (now < validFrom) {
        return { error: 'Code not yet active', success: false, visitorName: code.visitor_name }
    }

    if (now > validUntil) {
        return { error: 'Code expired', success: false, visitorName: code.visitor_name }
    }

    // Handle Clock In / Clock Out for Staff/Service Providers
    if (codeData.code_type === 'service_provider' || codeData.code_type === 'staff') {
        // Check for open session (Entry without Exit)
        const { data: lastLog } = await supabase
            .from('visitor_logs')
            .select('*')
            .eq('visitor_code_id', code.id)
            .is('exited_at', null)
            .order('entered_at', { ascending: false })
            .limit(1)
            .single()

        if (lastLog) {
            // CLOCK OUT
            const { error: updateError } = await supabase
                .from('visitor_logs')
                .update({
                    exited_at: now.toISOString(),
                    exit_point: 'Main Gate' // Could be dynamic if we had multiple gates
                })
                .eq('id', lastLog.id)

            if (updateError) {
                console.error('Error logging exit:', updateError)
                return { error: 'Failed to clock out', success: false }
            }

            // Notification for Clock Out
            try {
                const { sendNotification } = await import('@/lib/notifications')
                await sendNotification(
                    code.host_id,
                    community.id,
                    'visitor_arrival', // Use same type or new 'staff_activity' type
                    `${code.visitor_name} has CLOCKED OUT at ${now.toLocaleTimeString()}.`
                )
            } catch (e) {
                console.error('Error triggering notification:', e)
            }

            return {
                success: true,
                visitorName: code.visitor_name,
                message: `Clocked OUT at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            }
        } else {
            // CLOCK IN (Fall through to standard entry logic, but customized message)
            // We can just proceed to Entry Logic below, but we need to ensure we don't double-count usage if we don't want to.
            // Usually, "Usage" for staff = "Entry". So standard logic applies.
        }
    }

    // Standard Entry Logic (Visitor OR Staff Clock In)
    if (code.is_one_time && code.used_at) {
        return { error: 'One-time code already used', success: false, visitorName: code.visitor_name }
    }

    // Check Usage Limits (Strict check before Entry)
    if (!code.is_one_time && codeData.max_uses && (codeData.usage_count || 0) >= codeData.max_uses) {
        return { error: 'Usage limit exhausted', success: false, visitorName: code.visitor_name }
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
        try {
            const { sendNotification } = await import('@/lib/notifications')
            const isStaff = codeData.code_type === 'service_provider' || codeData.code_type === 'staff'

            // Usage Info for Notification
            const currentUse = (codeData.usage_count || 0) + 1
            const useInfo = codeData.max_uses ? ` (Use ${currentUse}/${codeData.max_uses})` : ` (Use ${currentUse})`

            const msg = isStaff
                ? `${code.visitor_name} has CLOCKED IN at ${now.toLocaleTimeString()}${useInfo}.`
                : `Your visitor ${code.visitor_name} has arrived at the Main Gate${useInfo}.`

            await sendNotification(
                code.host_id,
                community.id,
                'visitor_arrival',
                msg
            )
        } catch (e) {
            console.error('Error triggering notification:', e)
        }
    }

    // Mark as Used / Increment Count
    if (code.is_one_time) {
        await supabase
            .from('visitor_codes')
            .update({ used_at: now.toISOString() })
            .eq('id', code.id)
    } else {
        // Increment usage count (Unlimited or Limited)
        await supabase
            .from('visitor_codes')
            .update({ usage_count: (codeData.usage_count || 0) + 1 } as any)
            .eq('id', code.id)
    }

    const isStaff = codeData.code_type === 'service_provider' || codeData.code_type === 'staff'
    const currentUse = (codeData.usage_count || 0) + 1
    const useMsg = code.is_one_time ? '' : (codeData.max_uses ? ` (Use ${currentUse} of ${codeData.max_uses})` : ` (Use ${currentUse})`)

    return {
        success: true,
        visitorName: code.visitor_name,
        message: isStaff
            ? `Clocked IN at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${useMsg}`
            : `Entry Authorized${useMsg}`
    }
}
