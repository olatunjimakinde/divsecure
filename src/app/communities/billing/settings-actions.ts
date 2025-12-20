'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getBillingSettings(communityId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('billing_settings')
        .select('*')
        .eq('community_id', communityId)
        .single()
    return data
}

export async function updateBillingSettings(formData: FormData) {
    const supabase = await createClient()

    const communityId = formData.get('communityId') as string
    const communitySlug = formData.get('communitySlug') as string
    const blockAccessCodes = formData.get('blockAccessCodes') === 'true'
    const gracePeriodDays = parseInt(formData.get('gracePeriodDays') as string) || 0
    const securityGuardExempt = formData.get('securityGuardExempt') === 'true'

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // Upsert settings
    const { error } = await supabase.from('billing_settings').upsert({
        community_id: communityId,
        block_access_codes_if_unpaid: blockAccessCodes,
        grace_period_days: gracePeriodDays,
        security_guard_exempt: securityGuardExempt,
    })

    if (error) {
        console.error('Error updating billing settings:', error)
        throw new Error('Failed to update settings')
    }

    revalidatePath(`/communities/${communitySlug}/manager/billing`)
}
