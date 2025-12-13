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

async function createSuperAdmin() {
    const email = 'sadmin@divsecure.com'
    const password = 'MAKinde1q2w3e4r'

    console.log(`Creating Super Admin: ${email}`)

    // 1. Create User
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    })

    if (createError) {
        console.error('Error creating user:', createError)
        process.exit(1)
    }

    console.log(`User created: ${user.id}`)

    // 2. Promote to Super Admin
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_super_admin: true })
        .eq('id', user.id)

    if (updateError) {
        console.error('Error promoting user to super admin:', updateError)
        process.exit(1)
    }

    console.log('Successfully promoted to Super Admin.')
}

createSuperAdmin()
