import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials in .env.local')
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

export async function createTestUser() {
    const timestamp = Date.now()
    const email = `test.user.${timestamp}@example.com`
    const password = 'TestPassword123!'

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Test Manager'
        }
    })

    if (error) {
        throw new Error(`Failed to create test user: ${error.message}`)
    }

    // Ensure profile exists (in case triggers are missing or slow)
    // Removed 'role' and 'status' to avoid schema cache issues.
    // Login check only blocks 'removed', so default (or null) should work.
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: 'Test Manager'
    })

    if (profileError) {
        console.warn('Warning: Failed to create profile manually:', profileError.message)
    } else {
        console.log('Test User Profile Upserted Successfully');
    }

    // Double-check email verification
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
        email_confirm: true,
        user_metadata: { email_verified: true }
    });

    if (updateError) {
        console.warn('Warning: Failed to force confirm email:', updateError.message);
    }

    // Insert active subscription to bypass /subscribe redirect
    const { error: subError } = await supabaseAdmin.from('subscriptions').insert({
        user_id: data.user.id,
        status: 'active',
        current_period_end: new Date(Date.now() + 86400000).toISOString() // 1 day future
    });

    if (subError) {
        console.warn('Warning: Failed to create subscription:', subError.message);
    }

    return { email, password, userId: data.user.id }
}
