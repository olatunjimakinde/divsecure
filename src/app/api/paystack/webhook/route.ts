import { createAdminClient } from '@/lib/supabase/server'
import { verifyTransaction } from '@/lib/paystack'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
    const body = await request.json()
    const secret = process.env.PAYSTACK_SECRET_KEY

    // Verify webhook signature
    const hash = crypto.createHmac('sha512', secret!)
        .update(JSON.stringify(body))
        .digest('hex')

    if (hash !== request.headers.get('x-paystack-signature')) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = body.event
    const data = body.data

    if (event === 'charge.success') {
        const email = data.customer.email
        const planId = data.metadata.plan_id
        const communityId = data.metadata.community_id

        const supabaseAdmin = await createAdminClient()

        if (communityId) {
            // Handle Community Subscription (Renewal or Upgrade)
            const amount = data.amount / 100
            const reference = data.reference

            // 1. Record Payment
            await supabaseAdmin
                .from('subscription_payments')
                .insert({
                    community_id: communityId,
                    plan_id: planId,
                    amount: amount,
                    reference: reference,
                    status: 'success',
                    payment_date: new Date().toISOString()
                })

            // 2. Update Community Subscription
            const { data: existingSettings } = await supabaseAdmin
                .from('community_subscription_settings')
                .select('current_period_end')
                .eq('community_id', communityId)
                .single()

            let newPeriodEnd = new Date()
            if (existingSettings?.current_period_end && new Date(existingSettings.current_period_end) > new Date()) {
                // Extend existing subscription
                newPeriodEnd = new Date(existingSettings.current_period_end)
            }

            // Add 30 days
            newPeriodEnd.setDate(newPeriodEnd.getDate() + 30)

            await supabaseAdmin
                .from('community_subscription_settings')
                .upsert({
                    community_id: communityId,
                    plan_id: planId,
                    status: 'active',
                    current_period_end: newPeriodEnd.toISOString(),
                    updated_at: new Date().toISOString()
                })
        } else {
            // Handle New Community Subscription (Initial Payment)
            // Just record the payment, the community creation step will link it
            const amount = data.amount / 100
            const reference = data.reference
            const userId = data.metadata.user_id

            console.log(`Recording initial payment for user ${userId}, reference: ${reference}`)

            await supabaseAdmin
                .from('subscription_payments')
                .insert({
                    community_id: null, // Will be updated later
                    plan_id: planId,
                    amount: amount,
                    reference: reference,
                    status: 'success',
                    payment_date: new Date().toISOString()
                    // We might want to store user_id here if we add a column, but for now we rely on reference
                })
        }

        // Mock Email Receipt
        console.log(`[Mock Email] Sending payment receipt to ${email} for plan ${planId}`)
    }

    return NextResponse.json({ received: true })
}
