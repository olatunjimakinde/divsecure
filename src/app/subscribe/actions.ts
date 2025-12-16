'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { initializeTransaction } from '@/lib/paystack'
import { getURL } from '@/lib/utils'

export async function subscribeToPlan(formData: FormData) {
    const supabase = await createClient()
    const planId = formData.get('planId') as string
    const communityId = formData.get('communityId') as string | null
    const intent = formData.get('intent') as string | null

    console.log('Subscribe Action Debug - Intent:', intent, 'PlanId:', planId, 'CommunityId:', communityId)

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch plan details to get the price
    const { data: plan } = await supabase
        .from('subscription_plans')
        .select('price')
        .eq('id', planId)
        .single()

    if (!plan) {
        throw new Error('Plan not found')
    }

    if (plan.price === 0) {
        // Free plan, subscribe directly
        const supabaseAdmin = await createAdminClient()

        if (communityId) {
            // ... (existing code)
        } else if (intent === 'new_community') {
            // Handle Free Plan for New Community Creation
            // For free plans, we can just redirect to create community with a "free_plan" token
            // But to be secure, we should probably record a pending intent or similar.
            // For simplicity in this iteration, we'll just redirect to create with a special flag
            // and let the create action handle the actual subscription creation.
            redirect(`/communities/create?plan_id=${planId}`)
        } else {
            // ... (existing code)
        }
    }

    // Paid plan, initialize Paystack transaction
    try {
        const callbackUrl = intent === 'new_community'
            ? `${getURL()}communities/setup`
            : `${getURL()}dashboard?payment=success`

        console.log('Paystack Callback URL:', callbackUrl)

        const transaction = await initializeTransaction(
            user.email!,
            plan.price,
            callbackUrl,
            {
                plan_id: planId,
                community_id: communityId, // Can be null now
                intent: intent,
                user_id: user.id // Pass user_id for verification later
            }
        )

        // Redirect to Paystack checkout
        redirect(transaction.data.authorization_url)
    } catch (error) {
        console.error('Payment initialization failed:', error)
        throw error
    }
}
