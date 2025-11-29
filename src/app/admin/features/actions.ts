'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateFeatureDefault(key: string, defaultEnabled: boolean) {
    const supabase = await createClient()

    // Check Super Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles' as any)
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    if (!profile || !(profile as any).is_super_admin) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('features' as any)
        .update({ default_enabled: defaultEnabled })
        .eq('key', key)

    if (error) {
        console.error('Error updating feature:', error)
        return { error: 'Failed to update feature' }
    }

    revalidatePath('/admin/features')
    return { success: true }
}
