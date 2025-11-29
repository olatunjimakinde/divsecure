'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export type AdminRole = 'super_admin' | 'support_admin' | 'billing_admin'

export async function createAdminUser(email: string, role: AdminRole) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    // 1. Check Permissions (Must be Super Admin)
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

    // 2. Invite User
    const { data: newUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

    if (inviteError) {
        console.error('Error inviting admin:', inviteError)
        return { error: inviteError.message }
    }

    // 3. Set Role in Profile
    // The trigger creates the profile, but we need to update it with the role.
    // We might need to wait for the trigger or just update.
    // Since inviteUserByEmail creates the user immediately, the trigger should fire.

    if (newUser.user) {
        const { error: updateError } = await supabaseAdmin
            .from('profiles' as any)
            .update({
                admin_role: role,
                // If super_admin role is chosen, also set is_super_admin = true?
                // The prompt said "Super Admin should be able to create accounts for other admins".
                // And "is_super_admin boolean remains the god mode flag".
                // So if role is 'super_admin', we should set is_super_admin = true.
                is_super_admin: role === 'super_admin'
            })
            .eq('id', newUser.user.id)

        if (updateError) {
            console.error('Error updating admin profile:', updateError)
            return { error: 'User invited but failed to set role' }
        }
    }

    return { success: true }
}

export async function updateAdminRole(userId: string, role: AdminRole) {
    const supabase = await createClient()

    // Check Permissions
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
        .from('profiles' as any)
        .update({
            admin_role: role,
            is_super_admin: role === 'super_admin'
        })
        .eq('id', userId)

    if (error) {
        return { error: 'Failed to update role' }
    }

    return { success: true }
}
