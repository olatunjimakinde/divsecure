'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRecurringCharge(formData: FormData) {
    const supabase = await createClient()

    const communityId = formData.get('communityId') as string
    const communitySlug = formData.get('communitySlug') as string
    const title = formData.get('title') as string
    const amount = parseFloat(formData.get('amount') as string)
    const frequency = formData.get('frequency') as 'monthly' | 'quarterly' | 'yearly'

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single()

    console.log('Recurring Charge Debug:', {
        userId: user.id,
        communityId,
        memberRole: memberData?.role,
        memberError
    })

    if (memberError || memberData?.role !== 'community_manager') {
        console.error('Unauthorized: User is not a community manager for this community')
        return { error: 'Unauthorized: You must be a community manager.' }
    }

    const { error } = await supabase.from('recurring_charges').insert({
        community_id: communityId,
        title,
        amount,
        frequency,
    })

    if (error) {
        console.error('Error creating recurring charge:', error)
        // console.error('Form Data:', { communityId, title, amount, frequency }) // Debug log
        return { error: 'Failed to create recurring charge: ' + error.message }
    }

    revalidatePath(`/communities/${communitySlug}/manager/billing`)
}

export async function generateBillsFromRecurring(formData: FormData) {
    const supabase = await createClient()

    const communityId = formData.get('communityId') as string
    const communitySlug = formData.get('communitySlug') as string
    const chargeId = formData.get('chargeId') as string

    // Get the charge details
    const { data: charge } = await supabase
        .from('recurring_charges')
        .select('*')
        .eq('id', chargeId)
        .single()

    if (!charge) throw new Error('Charge not found')

    // Get all households in the community
    const { data: households } = await supabase
        .from('households')
        .select('id')
        .eq('community_id', communityId)

    if (!households || households.length === 0) {
        return // No households to bill
    }

    // Create bills for each household
    const bills = households.map(h => ({
        community_id: communityId,
        household_id: h.id,
        title: charge.title,
        amount: charge.amount,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Due in 30 days
        status: 'pending'
    }))

    const { error } = await supabase.from('bills').insert(bills as any)

    if (error) {
        console.error('Error generating bills:', error)
        throw new Error('Failed to generate bills')
    }

    // Update last generated
    await supabase.from('recurring_charges').update({
        last_generated_at: new Date().toISOString()
    }).eq('id', chargeId)

    revalidatePath(`/communities/${communitySlug}/manager/billing`)
}

export async function updateRecurringCharge(formData: FormData) {
    const supabase = await createClient()
    const chargeId = formData.get('chargeId') as string
    const title = formData.get('title') as string
    const amount = parseFloat(formData.get('amount') as string)
    const frequency = formData.get('frequency') as 'monthly' | 'quarterly' | 'yearly'
    const communitySlug = formData.get('communitySlug') as string

    // Get Charge
    const { data: charge } = await supabase.from('recurring_charges').select('community_id').eq('id', chargeId).single()
    if (!charge) return { error: 'Charge not found' }

    // Verify Manager
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', charge.community_id)
        .eq('user_id', user.id)
        .single()

    if (member?.role !== 'community_manager') return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('recurring_charges')
        .update({ title, amount, frequency })
        .eq('id', chargeId)

    if (error) {
        console.error('Error updating recurring charge:', error)
        return { error: 'Failed to update charge' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/billing`)
    return { success: true }
}

export async function deleteRecurringCharge(formData: FormData) {
    const supabase = await createClient()
    const chargeId = formData.get('chargeId') as string
    const communitySlug = formData.get('communitySlug') as string

    // Get Charge
    const { data: charge } = await supabase.from('recurring_charges').select('community_id').eq('id', chargeId).single()
    if (!charge) return { error: 'Charge not found' }

    // Verify Manager
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', charge.community_id)
        .eq('user_id', user.id)
        .single()

    if (member?.role !== 'community_manager') return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('recurring_charges')
        .delete()
        .eq('id', chargeId)

    if (error) {
        console.error('Error deleting recurring charge:', error)
        return { error: 'Failed to delete charge' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/billing`)
    return { success: true }
}

export async function toggleRecurringChargeStatus(formData: FormData) {
    const supabase = await createClient()
    const chargeId = formData.get('chargeId') as string
    const active = formData.get('active') === 'true'
    const communitySlug = formData.get('communitySlug') as string

    // Get Charge
    const { data: charge } = await supabase.from('recurring_charges').select('community_id').eq('id', chargeId).single()
    if (!charge) return { error: 'Charge not found' }

    // Verify Manager
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', charge.community_id)
        .eq('user_id', user.id)
        .single()

    if (member?.role !== 'community_manager') return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('recurring_charges')
        .update({ active })
        .eq('id', chargeId)

    if (error) {
        console.error('Error toggling recurring charge status:', error)
        return { error: 'Failed to update status' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/billing`)
    return { success: true }
}
