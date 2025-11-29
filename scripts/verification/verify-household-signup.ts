
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load env vars manually
try {
    const envFile = readFileSync(resolve(__dirname, '.env.local'), 'utf8')
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.trim()
        }
    })
} catch (e) {
    console.warn('Could not read .env.local')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function verifyHouseholdSignup() {
    console.log('Starting Household Signup Verification...')

    const timestamp = Date.now()
    const slug = `verify-hh-${timestamp}`
    const managerEmail = `manager-${timestamp}@example.com`
    const householdEmail = `household-${timestamp}@example.com`

    // 1. Setup Community
    console.log(`\n1. Setting up Community: ${slug}`)
    const { data: { user: managerUser }, error: createManagerError } = await supabaseAdmin.auth.admin.createUser({
        email: managerEmail,
        password: 'password123',
        email_confirm: true
    })
    if (createManagerError) throw createManagerError
    if (!managerUser) throw new Error('Failed to create manager')

    const { data: community, error: commError } = await supabaseAdmin
        .from('communities')
        .insert({
            name: 'Household Verification Community',
            slug: slug,
            owner_id: managerUser.id
        })
        .select()
        .single()
    if (commError) throw commError

    // 2. Simulate Household Signup (Action Logic)
    console.log(`\n2. Simulating Household Signup: ${householdEmail}`)
    const { data: { user: householdUser }, error: createHouseholdError } = await supabaseAdmin.auth.admin.createUser({
        email: householdEmail,
        password: 'password123',
        email_confirm: true
    })
    if (createHouseholdError) throw createHouseholdError
    if (!householdUser) throw new Error('Failed to create household user')

    // Simulate the action logic for 'household' role
    const { error: joinError } = await supabaseAdmin
        .from('members')
        .insert({
            community_id: community.id,
            user_id: householdUser.id,
            role: 'resident',
            status: 'pending',
            unit_number: 'H1',
            is_household_head: true // This is the key flag we are testing
        })
    if (joinError) throw joinError

    // 3. Verify Member Status and Flags
    console.log('\n3. Verifying Member Flags...')
    const { data: member } = await supabaseAdmin
        .from('members')
        .select('role, status, is_household_head')
        .eq('community_id', community.id)
        .eq('user_id', householdUser.id)
        .single()

    if (!member) throw new Error('Member not found')

    console.log('   Member Data:', member)

    if (member.role !== 'resident') throw new Error('Role should be resident')
    if (member.status !== 'pending') throw new Error('Status should be pending')
    if (member.is_household_head !== true) throw new Error('is_household_head should be true')

    console.log('   Verified: Member is pending resident and household head.')

    console.log('\nVerification Successful!')
}

verifyHouseholdSignup().catch(console.error)
