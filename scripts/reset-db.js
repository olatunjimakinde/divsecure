const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetDb() {
    console.log('Starting database reset...')

    // 1. Delete all Communities (Cascades to most data)
    console.log('Deleting communities...')
    const { error: commError } = await supabase
        .from('communities')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (commError) {
        console.error('Error deleting communities:', commError)
    }

    // 2. Delete all Users
    console.log('Fetching all users...')
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
        console.error('Error fetching users:', usersError)
        process.exit(1)
    }

    console.log(`Found ${users.length} users to delete.`)

    for (const user of users) {
        console.log(`Deleting user ${user.id} (${user.email})...`)
        const { error: delError } = await supabase.auth.admin.deleteUser(user.id)
        if (delError) {
            console.error(`Failed to delete user ${user.id}:`, delError)
        }
    }

    console.log('Database reset complete.')
}

resetDb()
