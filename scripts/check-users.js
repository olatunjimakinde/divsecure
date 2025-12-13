const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
    console.log('Checking users...')

    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
        console.error('Error fetching users:', usersError)
        return
    }

    console.log(`Found ${users.length} users in Auth.`)

    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
    }

    console.log(`Found ${profiles.length} profiles.`)

    users.forEach(u => {
        const profile = profiles.find(p => p.id === u.id)
        console.log(`User: ${u.email} (${u.id}) - Super Admin: ${profile?.is_super_admin}`)
    })
}

checkUsers()
