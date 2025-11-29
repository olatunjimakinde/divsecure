'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clockIn(formData: FormData) {
    const supabase = await createClient()
    const shiftId = formData.get('shiftId') as string
    const communitySlug = formData.get('communitySlug') as string

    const { error } = await supabase
        .from('shifts')
        .update({
            status: 'active',
            clock_in_time: new Date().toISOString()
        })
        .eq('id', shiftId)

    if (error) return { error: 'Failed to clock in' }

    revalidatePath(`/communities/${communitySlug}/security`)
    return { success: true }
}

export async function clockOut(formData: FormData) {
    const supabase = await createClient()
    const shiftId = formData.get('shiftId') as string
    const communitySlug = formData.get('communitySlug') as string

    const { error } = await supabase
        .from('shifts')
        .update({
            status: 'completed',
            clock_out_time: new Date().toISOString()
        })
        .eq('id', shiftId)

    if (error) return { error: 'Failed to clock out' }

    revalidatePath(`/communities/${communitySlug}/security`)
    return { success: true }
}
