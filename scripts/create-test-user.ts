
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

async function main() {
    // Read .env.local
    const envPath = path.resolve(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const env: Record<string, string> = {}
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            env[key.trim()] = value.trim()
        }
    })

    const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY']

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase keys')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const email = 'testmanager@example.com'
    const password = 'Password123!'

    // 1. Create User
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Test Manager',
            phone: '1234567890'
        }
    })

    if (userError) {
        console.error('Error creating user:', userError)
        // If user already exists, try to sign in or get id?
        // For now, just exit.
        // process.exit(1)
    }

    if (!user?.user) {
        console.log('User might already exist or failed to create.')
        // Try to get user by email? Admin API doesn't have getUserByEmail directly exposed easily without listUsers
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === email)
        if (existingUser) {
            console.log('Found existing user:', existingUser.id)
            // We can proceed with this user
            // But we need to make sure they are a manager of a community to access dashboard?
            // Or just use them to create a NEW community.
            return
        }
        process.exit(1)
    }

    console.log('Created user:', user.user.id)

    // We don't need to create a community for them if we want to test the creation flow.
    // But to access the dashboard, they might need to be a member of *some* community?
    // The dashboard might redirect if no communities.
    // Let's create a dummy community so they have a home.

    const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert({
            name: 'Test Home',
            slug: 'test-home-' + Date.now(),
            description: 'A home for the test user',
            owner_id: user.user.id
        })
        .select()
        .single()

    if (communityError) {
        console.error('Error creating community:', communityError)
        process.exit(1)
    }

    console.log('Created community:', community.id)

    const { error: memberError } = await supabase.from('members').insert({
        community_id: community.id,
        user_id: user.user.id,
        role: 'community_manager',
        status: 'approved'
    })

    if (memberError) {
        console.error('Error creating member:', memberError)
        process.exit(1)
    }

    console.log('User setup complete.')
}

main()
