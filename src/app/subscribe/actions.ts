'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function subscribeToPlan(formData: FormData) {
    const supabase = await createClient()
    const planId = formData.get('planId') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // SIMULATED PAYMENT:
    // In a real app, we would create a Stripe Checkout Session here and redirect to it.
    // For now, we just create the subscription record directly.

    const supabaseAdmin = await createAdminClient()

    // Check if subscription exists
    const { data: existingSub } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (existingSub) {
        // Update existing
        const { error } = await supabaseAdmin
            .from('subscriptions')
            .update({
                plan_id: planId,
                status: 'active',
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            })
            .eq('id', existingSub.id)

        if (error) {
            console.error('Error updating subscription:', error)
            return { error: 'Failed to update subscription' }
        }
    } else {
        // Create new
        const { error } = await supabaseAdmin
            .from('subscriptions')
            .insert({
                user_id: user.id,
                plan_id: planId,
                status: 'active',
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            })

        if (error) {
            console.error('Error creating subscription:', error)
            return { error: 'Failed to create subscription' }
        }
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}
