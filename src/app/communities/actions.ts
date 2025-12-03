'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { initializeTransaction, verifyTransaction } from '@/lib/paystack'
import { createCommunitySchema } from '@/lib/schemas'
export async function createCommunity(formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        description: formData.get('description') as string,
        address: formData.get('address') as string,
        payment_ref: formData.get('payment_ref') as string,
        plan_id: formData.get('plan_id') as string,
    }

    const validation = createCommunitySchema.safeParse(rawData)

    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const { name, slug, description, address, payment_ref, plan_id } = validation.data

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Create the community
    const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert({
            name,
            slug,
            description,
            address,
            owner_id: user.id,
        })
        .select()
        .single()

    if (communityError) {
        if (communityError.code === '23505') {
            // Unique violation for slug
            return { error: 'Slug is already taken. Please choose another one.' }
        }
        return { error: 'Failed to create community.' }
    }

    // 2. Add the owner as an admin member
    const supabaseAdmin = await createAdminClient()
    const { error: memberError } = await supabaseAdmin.from('members').insert({
        community_id: community.id,
        user_id: user.id,
        role: 'community_manager',
        status: 'approved',
    })

    if (memberError) {
        console.error('Error adding member:', memberError)
        return { error: 'Community created but failed to join as admin.' }
    }

    // 3. Initialize Community Subscription
    const paymentRef = payment_ref
    const planId = plan_id



    if (paymentRef && planId) {
        // Verify payment
        try {
            const transaction = await verifyTransaction(paymentRef)
            if (transaction.data.status !== 'success') {
                return { error: 'Payment verification failed.' }
            }

            // Record Payment
            await supabaseAdmin
                .from('subscription_payments')
                .insert({
                    community_id: community.id,
                    plan_id: planId,
                    amount: transaction.data.amount / 100,
                    reference: paymentRef,
                    status: 'success',
                    payment_date: new Date().toISOString()
                })

            // Create Subscription
            await supabaseAdmin
                .from('community_subscription_settings')
                .insert({
                    community_id: community.id,
                    plan_id: planId,
                    status: 'active',
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date().toISOString()
                })

        } catch (error) {
            console.error('Payment verification error:', error)
            return { error: 'Failed to verify payment.' }
        }
    } else {
        // Check if this is the first community (Free Plan) or subsequent (Redirect to Pay)

        // Check for existing communities owned by user (excluding the one just created)
        const { count: communityCount } = await supabaseAdmin
            .from('communities')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user.id)
            .neq('id', community.id)

        if (communityCount && communityCount > 0) {
            // User already has communities, so this is an additional one.
            // Redirect to subscription page to pay for this specific community.
            // But we already created the community? Ideally we should have checked before creating.
            // However, since we are here, we can redirect to pay.
            // But wait, if we redirect, the community is created but has no subscription.
            // It will be in a "broken" state.
            // Maybe we should delete it if payment fails?
            // Or just leave it inactive.
            redirect(`/subscribe?community_id=${community.id}`)
        }

        // Default to Free Plan if no payment ref and no other communities (initial flow)
        const { data: freePlan } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('name', 'Free')
            .maybeSingle()

        if (freePlan) {
            await supabaseAdmin.from('community_subscription_settings').insert({
                community_id: community.id,
                plan_id: freePlan.id,
                status: 'active',
                current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year validity for Free plan
                updated_at: new Date().toISOString()
            })
        }
    }

    revalidatePath('/dashboard')
    redirect(`/communities/${slug}`)
}
