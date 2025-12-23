'use server'

import { createAdminClient } from '@/lib/supabase/server'

export async function isSuperAdmin(userId: string): Promise<boolean> {
    const supabase = await createAdminClient()
    const { data: profile } = await supabase
        .from('profiles' as any)
        .select('is_super_admin')
        .eq('id', userId)
        .single()
    return !!(profile as any)?.is_super_admin
}
