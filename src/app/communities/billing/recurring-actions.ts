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

    const { error } = await supabase.from('recurring_charges').insert({
        community_id: communityId,
        title,
        amount,
        frequency,
    })

    if (error) {
        console.error('Error creating recurring charge:', error)
        throw new Error('Failed to create recurring charge')
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
