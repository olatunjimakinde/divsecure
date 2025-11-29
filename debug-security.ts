
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
    console.log('--- Verifying Database Tables ---')

    const tables = ['members', 'shifts', 'visitor_codes', 'visitor_logs']
    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true })
        if (error) {
            console.error(`Error accessing table ${table}:`, error.message)
        } else {
            console.log(`Table ${table} exists and is accessible.`)
        }
    }

    console.log('\n--- Checking Member Roles Constraint ---')
    // We can't easily check constraints via JS client, but we can try to insert a dummy member with 'head_of_security' role
    // to see if it fails.

    // First, get a valid community and user (or create dummy ones if needed, but let's try to read first)
    const { data: communities } = await supabase.from('communities').select('id').limit(1)
    if (!communities || communities.length === 0) {
        console.log('No communities found to test insertion.')
        return
    }
    const communityId = communities[0].id
    console.log(`Using Community ID: ${communityId}`)

    // Create a dummy user for testing
    const email = `test-guard-${Date.now()}@example.com`
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    })

    if (userError) {
        console.error('Failed to create test user:', userError.message)
        return
    }
    console.log(`Created test user: ${user.user.id}`)

    console.log('Attempting to insert member with role "head_of_security"...')
    const { error: memberError } = await supabase.from('members').insert({
        community_id: communityId,
        user_id: user.user.id,
        role: 'head_of_security',
        status: 'approved'
    })

    if (memberError) {
        console.error('FAILED to insert head_of_security:', memberError.message)
    } else {
        console.log('SUCCESS: Inserted head_of_security member.')

        // Clean up
        await supabase.from('members').delete().eq('user_id', user.user.id)
    }

    // Clean up user
    await supabase.auth.admin.deleteUser(user.user.id)
}

main()
