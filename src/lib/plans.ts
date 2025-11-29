'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePlan(planId: string, data: { name: string; price: number; features: any }) {
    const supabase = await createClient()

    // Check if user is super admin
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data: profile } = await supabase
        .from('profiles' as any)
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    if (!profile || !(profile as any).is_super_admin) {
        throw new Error('Unauthorized: Super Admin access required')
    }

    const { error } = await supabase
        .from('subscription_plans' as any)
        .update({
            name: data.name,
            price: data.price,
            features: data.features,
        })
        .eq('id', planId)

    if (error) {
        console.error('Error updating plan:', error)
        throw new Error('Failed to update plan')
    }

    revalidatePath('/admin/subscriptions')
    revalidatePath('/subscribe') // Update public pricing page too
}
