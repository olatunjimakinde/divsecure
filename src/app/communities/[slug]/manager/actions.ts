'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function verifyManager(communityId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single()

    return member?.role === 'community_manager'
}

export async function approveResidentCore(supabaseAdmin: any, memberId: string, communityId: string) {
    // 1. Get the member to check if they are a household head
    const { data: member, error: fetchError } = await supabaseAdmin
        .from('members')
        .select('is_household_head, unit_number, user_id')
        .eq('id', memberId)
        .single()

    if (fetchError || !member) {
        console.error('Error fetching member:', fetchError)
        return { error: fetchError }
    }

    // 2. Approve the member
    const { error } = await supabaseAdmin
        .from('members')
        .update({ status: 'approved' })
        .eq('id', memberId)

    if (error) {
        console.error('Error approving resident:', error)
        return { error }
    }

    // 3. If Household Head, create/link household
    if (member.is_household_head && member.unit_number) {
        // Check if household exists
        const { data: existingHousehold } = await supabaseAdmin
            .from('households')
            .select('id')
            .eq('community_id', communityId)
            .eq('name', member.unit_number)
            .single()

        let householdId = existingHousehold?.id

        if (!householdId) {
            // Create household
            const { data: newHousehold, error: createError } = await supabaseAdmin
                .from('households')
                .insert({
                    community_id: communityId,
                    name: member.unit_number,
                    contact_email: null // Could fetch user email if needed, but optional
                })
                .select()
                .single()

            if (createError) {
                console.error('Error creating household:', createError)
                // Continue execution, don't fail approval? Or maybe we should alert.
                // For now, we just log.
            } else {
                householdId = newHousehold.id
            }
        }

        if (householdId) {
            // Link member to household
            const { error: linkError } = await supabaseAdmin
                .from('members')
                .update({ household_id: householdId })
                .eq('id', memberId)

            if (linkError) {
                console.error('Error linking member to household:', linkError)
            }
        }
    }
    return { success: true }
}

export async function approveResident(formData: FormData) {
    const communityId = formData.get('communityId') as string
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string

    if (!memberId || !communityId) return

    if (!await verifyManager(communityId)) {
        console.error('Unauthorized: Not a manager')
        return
    }

    const supabaseAdmin = await createAdminClient()
    await approveResidentCore(supabaseAdmin, memberId, communityId)

    revalidatePath(`/communities/${communitySlug}/manager`)
}

export async function rejectResident(formData: FormData) {
    const communityId = formData.get('communityId') as string
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string

    if (!memberId || !communityId) return

    if (!await verifyManager(communityId)) {
        console.error('Unauthorized: Not a manager')
        return
    }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('members')
        .update({ status: 'rejected' })
        .eq('id', memberId)

    if (error) {
        console.error('Error rejecting resident:', error)
        return
    }

    revalidatePath(`/communities/${communitySlug}/manager`)
}

export async function updateResident(formData: FormData) {
    const communityId = formData.get('communityId') as string
    const memberId = formData.get('memberId') as string
    const unitNumber = formData.get('unitNumber') as string
    const communitySlug = formData.get('communitySlug') as string

    if (!memberId || !communityId) return

    if (!await verifyManager(communityId)) {
        console.error('Unauthorized: Not a manager')
        return
    }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('members')
        .update({ unit_number: unitNumber })
        .eq('id', memberId)

    if (error) {
        console.error('Error updating resident:', error)
        return
    }

    revalidatePath(`/communities/${communitySlug}/manager`)
}

export async function suspendResident(formData: FormData) {
    const communityId = formData.get('communityId') as string
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string

    if (!memberId || !communityId) return

    if (!await verifyManager(communityId)) {
        console.error('Unauthorized: Not a manager')
        return
    }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('members')
        .update({ status: 'suspended' })
        .eq('id', memberId)

    if (error) {
        console.error('Error suspending resident:', error)
        return
    }

    revalidatePath(`/communities/${communitySlug}/manager`)
}

export async function deleteResident(formData: FormData) {
    const communityId = formData.get('communityId') as string
    const memberId = formData.get('memberId') as string
    const communitySlug = formData.get('communitySlug') as string

    if (!memberId || !communityId) return

    if (!await verifyManager(communityId)) {
        console.error('Unauthorized: Not a manager')
        return
    }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('members')
        .delete()
        .eq('id', memberId)

    if (error) {
        console.error('Error deleting resident:', error)
        return
    }

    revalidatePath(`/communities/${communitySlug}/manager`)
}

export async function addGuard(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const email = formData.get('email') as string
    const communityId = formData.get('communityId') as string

    if (!email || !communityId) return

    if (!await verifyManager(communityId)) {
        return { error: 'Unauthorized' }
    }

    // 1. Find user by email
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

    if (!profile) {
        // In a real app, we might send an invite email here
        console.error('User not found')
        return { error: 'User not found' }
    }

    // 2. Add as guard
    const { error } = await supabaseAdmin
        .from('members')
        .insert({
            community_id: communityId,
            user_id: profile.id,
            role: 'guard',
            status: 'approved'
        })

    if (error) {
        console.error('Error adding guard:', error)
        return { error: 'Failed to add guard' }
    }

    revalidatePath('/communities/[slug]/manager', 'page')
}

export async function removeGuard(formData: FormData) {
    const communityId = formData.get('communityId') as string
    const memberId = formData.get('memberId') as string

    if (!memberId || !communityId) return

    if (!await verifyManager(communityId)) {
        console.error('Unauthorized: Not a manager')
        return
    }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('members')
        .delete()
        .eq('id', memberId)

    if (error) {
        console.error('Error removing guard:', error)
        return
    }

    revalidatePath('/communities/[slug]/manager', 'page')
}
