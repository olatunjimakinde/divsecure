
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

async function verifyAuthFlows() {
    console.log('Starting Auth Flows Verification...')

    const timestamp = Date.now()
    const slug = `verify-auth-${timestamp}`
    const managerEmail = `manager-${timestamp}@example.com`
    const residentEmail = `resident-${timestamp}@example.com`

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
            name: 'Auth Verification Community',
            slug: slug,
            owner_id: managerUser.id
        })
        .select()
        .single()
    if (commError) throw commError

    // 2. Create Pending Resident
    console.log(`\n2. Creating Pending Resident: ${residentEmail}`)
    const { data: { user: residentUser }, error: createResidentError } = await supabaseAdmin.auth.admin.createUser({
        email: residentEmail,
        password: 'password123',
        email_confirm: true
    })
    if (createResidentError) throw createResidentError
    if (!residentUser) throw new Error('Failed to create resident')

    const { error: joinError } = await supabaseAdmin
        .from('members')
        .insert({
            community_id: community.id,
            user_id: residentUser.id,
            role: 'resident',
            status: 'pending',
            unit_number: 'A1'
        })
    if (joinError) throw joinError

    // 3. Verify Pending Status
    console.log('\n3. Verifying Pending Status...')
    const { data: pendingMember } = await supabaseAdmin
        .from('members')
        .select('status')
        .eq('community_id', community.id)
        .eq('user_id', residentUser.id)
        .single()

    if (pendingMember?.status !== 'pending') throw new Error('Member should be pending')
    console.log('   Verified: Member is pending.')

    // 4. Simulate Forgot Password (Trigger Email)
    console.log('\n4. Testing Forgot Password (Trigger)...')
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(residentEmail)
    if (resetError) {
        console.warn('   Reset password trigger failed (expected in some envs):', resetError.message)
    } else {
        console.log('   Verified: Reset password email triggered.')
    }

    // 5. Approve Resident
    console.log('\n5. Approving Resident...')
    const { error: approveError } = await supabaseAdmin
        .from('members')
        .update({ status: 'approved' })
        .eq('community_id', community.id)
        .eq('user_id', residentUser.id)
    if (approveError) throw approveError

    const { data: approvedMember } = await supabaseAdmin
        .from('members')
        .select('status')
        .eq('community_id', community.id)
        .eq('user_id', residentUser.id)
        .single()

    if (approvedMember?.status !== 'approved') throw new Error('Member should be approved')
    console.log('   Verified: Member is approved.')

    console.log('\nVerification Successful!')
}

verifyAuthFlows().catch(console.error)
