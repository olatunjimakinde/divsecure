'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()

    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            phone: phone || null
        })
        .eq('id', user.id)

    if (error) {
        console.error('Error updating profile:', error)
        return { error: 'Failed to update profile: ' + error.message }
    }

    console.log('Profile updated successfully for:', user.id)

    revalidatePath(`/communities/${communitySlug}/profile`)
    return { success: true }
}
