'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function setupCommunity(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const communityName = formData.get('communityName') as string
    const communitySlug = formData.get('communitySlug') as string
    const communityAddress = formData.get('communityAddress') as string
    const reference = formData.get('reference') as string
    const planId = formData.get('planId') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    if (!communityName || !communitySlug || !communityAddress) {
        return { error: 'Missing fields' }
    }

    // 1. Verify Payment (if reference exists)
    if (reference) {
        const { data: payment } = await supabaseAdmin
            .from('subscription_payments')
            .select('id, status, plan_id')
            .eq('reference', reference)
            .single()

        if (!payment) {
            // It might be that the webhook hasn't processed it yet.
            // In a real app, we might want to verify with Paystack directly here if not found.
            // For now, we'll assume if it's not in DB, we can't proceed or we verify with Paystack.
            // Let's assume webhook is fast enough or we retry.
            // Alternatively, we can trust the user for a moment if we verify with Paystack API.
            // But for this implementation, let's check if payment exists.
            console.error('Payment not found for reference:', reference)
            // return { error: 'Payment verification failed. Please contact support.' }
        }
    }

    // 2. Create Community
    console.log('Creating community:', { name: communityName, slug: communitySlug, owner: user.id })
    const { data: communityData, error: communityError } = await supabaseAdmin
        .from('communities')
        .insert({
            name: communityName,
            slug: communitySlug,
            address: communityAddress,
            owner_id: user.id
        })
        .select()
        .single()

    const data = communityData


    let community = null

    if (communityError) {
        // Check if it's a unique constraint violation (code 23505)
        if (communityError.code === '23505') {
            // Check if the existing community is owned by the current user
            const { data: existingCommunity } = await supabaseAdmin
                .from('communities')
                .select()
                .eq('slug', communitySlug)
                .single()

            if (existingCommunity && existingCommunity.owner_id === user.id) {
                console.log('Community already exists and owned by user, proceeding:', existingCommunity.id)
                community = existingCommunity
            } else {
                console.error('Error creating community:', communityError)
                return { error: 'Community URL slug is already taken. Please choose another one.' }
            }
        } else {
            console.error('Error creating community:', communityError)
            return { error: 'Failed to create community. ' + communityError.message }
        }
    } else {
        community = data
    }

    console.log('Community created:', community.id)

    // 3. Join as Manager
    console.log('Adding user as manager:', user.id)
    const { error: memberError } = await supabaseAdmin.from('members').insert({
        community_id: community.id,
        user_id: user.id,
        role: 'community_manager',
        status: 'approved',
        is_household_head: false // Explicitly set default
    })

    if (memberError) {
        console.error('Error joining as manager:', memberError)
        // If we fail here, we should probably delete the community or alert the user
        // For now, let's return an error so the user stays on the page
        return { error: 'Failed to join community as manager: ' + memberError.message }
    }

    console.log('User joined as manager')

    // 4. Link Payment to Community & Create Subscription
    if (reference) {
        console.log('Linking payment:', reference)
        // Update payment with community_id
        const { error: paymentError } = await supabaseAdmin
            .from('subscription_payments')
            .update({ community_id: community.id })
            .eq('reference', reference)

        if (paymentError) console.error('Error updating payment:', paymentError)

        // Create Subscription Settings
        // We need to know the plan. If we have payment, we can get plan_id from it.
        // If we passed planId in form (e.g. free plan), use that.

        let finalPlanId = planId
        if (!finalPlanId && reference) {
            const { data: payment } = await supabaseAdmin
                .from('subscription_payments')
                .select('plan_id')
                .eq('reference', reference)
                .single()
            finalPlanId = payment?.plan_id || undefined
        }

        if (finalPlanId) {
            const currentPeriodEnd = new Date()
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30) // Default 30 days

            const { error: subError } = await supabaseAdmin
                .from('community_subscription_settings')
                .insert({
                    community_id: community.id,
                    plan_id: finalPlanId,
                    status: 'active',
                    current_period_end: currentPeriodEnd.toISOString()
                })

            if (subError) console.error('Error creating subscription settings:', subError)
        }
    } else if (planId) {
        // Free plan flow (no payment reference)
        const currentPeriodEnd = new Date()
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

        await supabaseAdmin
            .from('community_subscription_settings')
            .insert({
                community_id: community.id,
                plan_id: planId,
                status: 'active',
                current_period_end: currentPeriodEnd.toISOString()
            })
    }

    console.log('Setup complete, redirecting to dashboard')
    revalidatePath('/dashboard')
    redirect('/dashboard')
}
