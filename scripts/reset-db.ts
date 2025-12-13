import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetDb() {
    console.log('Starting database reset...')

    // 1. Find Super Admin
    const { data: superAdmins, error: saError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('is_super_admin', true)

    if (saError) {
        console.error('Error finding super admin:', saError)
        process.exit(1)
    }

    if (!superAdmins || superAdmins.length === 0) {
        console.error('No super admin found! Aborting to prevent total data loss.')
        process.exit(1)
    }

    const superAdminIds = superAdmins.map(sa => sa.id)
    console.log('Found super admins:', superAdminIds)

    // 2. Delete all Communities (Cascades to most data)
    console.log('Deleting communities...')
    const { error: commError } = await supabase
        .from('communities')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (commError) {
        console.error('Error deleting communities:', commError)
    }

    // 3. Delete all Users (except Super Admin)
    console.log('Fetching all users...')
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
        console.error('Error fetching users:', usersError)
        process.exit(1)
    }

    const usersToDelete = users.filter(u => !superAdminIds.includes(u.id))
    console.log(`Found ${usersToDelete.length} users to delete.`)

    for (const user of usersToDelete) {
        console.log(`Deleting user ${user.id} (${user.email})...`)
        const { error: delError } = await supabase.auth.admin.deleteUser(user.id)
        if (delError) {
            console.error(`Failed to delete user ${user.id}:`, delError)
        }
    }

    console.log('Database reset complete.')
}

resetDb()
