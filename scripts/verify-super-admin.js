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

async function verifySuperAdmin() {
    const email = 'sadmin@divsecure.com'
    console.log(`Verifying Super Admin: ${email}`)

    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 })

    if (error) {
        console.error('List Users Error:', error)
        return
    }

    console.log(`Found ${users.length} users.`)
    const user = users.find(u => u.email === email)
    if (!user) {
        console.error('User not found in Auth list. Available emails:', users.map(u => u.email).join(', '))
        return
    }
    console.log('Auth User ID:', user.id)

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    if (profileError) {
        console.error('Profile Error:', profileError)
    } else {
        console.log('Profile Data:', profile)
    }
}

verifySuperAdmin()
