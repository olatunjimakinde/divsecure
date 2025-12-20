'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getURL } from '@/lib/utils'

const inviteSchema = z.object({
    email: z.string().email(),
    fullName: z.string().min(2),
    communityId: z.string().uuid(),
    communitySlug: z.string().min(1),
    householdId: z.string().uuid(), // Required now
})

export async function inviteResident(formData: FormData) {
    const supabase = await createClient()

    // 1. Verify User is Manager/Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const householdId = formData.get('householdId') as string | null

    // Check if household exists and get its unit name for fallback
    let unitNumber = ''
    if (householdId) {
        const { data: household } = await supabase
            .from('households')
            .select('name')
            .eq('id', householdId)
            .single()

        if (household) {
            unitNumber = household.name
        }
    }

    const rawData = {
        email: formData.get('email'),
        fullName: formData.get('fullName'),
        communityId: formData.get('communityId'),
        communitySlug: formData.get('communitySlug'),
        householdId: formData.get('householdId') as string | null,
    }

    const validation = inviteSchema.safeParse(rawData)
    if (!validation.success) {
        console.error('Invite Validation Error:', validation.error.issues[0].message)
        return { error: validation.error.issues[0].message }
    }

    const { email, fullName, communityId, communitySlug } = validation.data
    // householdId is validated by schema, but we use the formData one for simplicity in previous logic, actually we should use validation.data.householdId

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

    return await inviteResidentCore(email, fullName, communityId, communitySlug, validation.data.householdId, unitNumber)
}

// Core function to reuse for Bulk Invite
async function inviteResidentCore(email: string, fullName: string, communityId: string, communitySlug: string, householdId: string, unitNumber: string) {
    const supabaseAdmin = await createAdminClient()
    const supabase = await createClient() // Need client for session checks if used, but admin is fine for invites

    // 2. Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single()

    let targetUserId: string | null | undefined = existingProfile?.id

    if (targetUserId) {
        console.log(`Adding existing user ${targetUserId} to community ${communityId}`)
    } else {
        console.log(`Inviting new user ${email} to community ${communityId}`)

        const redirectTo = `${getURL()}auth/confirm?next=${encodeURIComponent('/update-password')}`

        const { data: inviteResult, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name: fullName,
            },
            redirectTo
        })

        if (inviteError) {
            console.error('Invite Error:', inviteError)
            if ((inviteError as any).code === 'email_address_invalid' || inviteError.status === 400) {
                // Fallback logic
                const { data: linkResult, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'invite',
                    email: email,
                    options: {
                        data: { full_name: fullName },
                        redirectTo
                    }
                })

                if (linkError) {
                    return { error: 'Failed to send invitation: ' + inviteError?.message }
                }
                targetUserId = linkResult.user?.id || null
            } else {
                return { error: 'Failed to send invitation: ' + inviteError?.message }
            }
        } else {
            targetUserId = inviteResult.user.id
        }

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
            status: 'approved',
            is_household_head: false, // Default false, invited to household
            household_id: householdId
        })

    if (memberError) {
        console.error('Member Insert Error:', memberError)
        return { error: 'Failed to add member to community' }
    }

    revalidatePath(`/communities/${communitySlug}/manager`)
    return { success: true }
}

export async function bulkInviteResidents(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const communityId = formData.get('communityId') as string
    const communitySlug = formData.get('communitySlug') as string
    const file = formData.get('file') as File

    if (!file || !communityId) return { error: 'Missing file or community ID' }

    // Parse CSV
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim() !== '')
    const headers = lines[0].split(',').map(h => h.trim())

    // Quick validation of headers
    if (!headers.includes('email') || !headers.includes('household_name')) {
        return { error: 'CSV must contain "email" and "household_name" columns' }
    }

    // Fetch all households for mapping
    const { data: households } = await supabase
        .from('households')
        .select('id, name')
        .eq('community_id', communityId)

    if (!households) return { error: 'No households found in community' }

    const householdMap = new Map(households.map(h => [h.name.trim().toLowerCase(), h.id]))

    const result = {
        count: 0,
        errors: [] as string[]
    }

    // Prepare batch (for now doing sequential to reuse inviteResidentCore, could optimize later)
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const row: Record<string, string> = {}
        headers.forEach((h, index) => {
            row[h] = values[index] ?? ''
        })

        const email = row['email']
        const fullName = row['full_name'] || email.split('@')[0]
        const householdName = row['household_name']

        if (!email || !householdName) {
            result.errors.push(`Row ${i + 1}: Missing email or household name`)
            continue
        }

        // Map household
        const householdId = householdMap.get(householdName.toLowerCase())
        if (!householdId) {
            result.errors.push(`Row ${i + 1}: Household "${householdName}" not found`)
            continue
        }

        const inviteRes = await inviteResidentCore(email, fullName, communityId, communitySlug, householdId, householdName)
        if (inviteRes.error) {
            result.errors.push(`Row ${i + 1} (${email}): ${inviteRes.error}`)
        } else {
            result.count++
        }
    }

    revalidatePath(`/communities/${communitySlug}/manager`)
    return result
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

    revalidatePath(`/communities/${communitySlug}/manager`)
    return { success: true }
}
