
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

async function verifyResidentManagement() {
    console.log('Starting Resident Management Verification...')

    // 1. Setup: Create Community, Household, Head
    const timestamp = Date.now()
    const slug = `verify-res-${timestamp}`
    const headEmail = `head-${timestamp}@example.com`
    const residentEmail = `resident-${timestamp}@example.com`

    console.log(`\n1. Setting up test data...`)
    console.log(`   Community: ${slug}`)
    console.log(`   Head: ${headEmail}`)

    // Create Owner Profile (reuse head for simplicity or create separate)
    const { data: headData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: headEmail,
        password: 'password123',
        email_confirm: true,
        user_metadata: { full_name: 'Test Head' }
    })
    if (createError) throw createError
    const headUser = headData.user
    if (!headUser) throw new Error('Failed to create head user')

    // Create Community
    const { data: community, error: commError } = await supabaseAdmin
        .from('communities')
        .insert({
            name: 'Verification Community',
            slug: slug,
            owner_id: headUser.id
        })
        .select()
        .single()
    if (commError) throw commError

    // Create Household
    const { data: household, error: hhError } = await supabaseAdmin
        .from('households')
        .insert({
            community_id: community.id,
            name: 'Head Household'
        })
        .select()
        .single()
    if (hhError) throw hhError

    // Make Head a Member and Household Head
    const { error: memberError } = await supabaseAdmin
        .from('members')
        .insert({
            community_id: community.id,
            user_id: headUser.id,
            role: 'resident',
            status: 'approved',
            household_id: household.id,
            is_household_head: true
        })
    if (memberError) throw memberError

    console.log('   Setup complete.')

    // 2. Simulate Invite (New User)
    console.log('\n2. Testing Invite (New User)...')

    // Logic from action: Check if user exists
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', residentEmail)
        .single()

    let residentId = profile?.id

    if (!residentId) {
        console.log('   User not found, inviting...')
        // Try invite, fallback to create if it fails (e.g. local env issues)
        try {
            const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(residentEmail)
            if (inviteError) {
                console.warn('   Invite failed, falling back to createUser:', inviteError.message)
                const { data: createData, error: createResError } = await supabaseAdmin.auth.admin.createUser({
                    email: residentEmail,
                    password: 'password123',
                    email_confirm: true
                })
                if (createResError) throw createResError
                residentId = createData.user?.id
            } else {
                residentId = inviteData.user?.id
            }
        } catch (e) {
            console.warn('   Invite exception, falling back to createUser')
            const { data: createData, error: createResError } = await supabaseAdmin.auth.admin.createUser({
                email: residentEmail,
                password: 'password123',
                email_confirm: true
            })
            if (createResError) throw createResError
            residentId = createData.user?.id
        }
        console.log('   User created/invited:', residentId)
    }

    if (!residentId) throw new Error('Failed to get resident ID')

    // Add to household (Action logic)
    const { error: addError } = await supabaseAdmin
        .from('members')
        .insert({
            community_id: community.id,
            user_id: residentId,
            role: 'resident',
            status: 'approved',
            household_id: household.id
        })

    if (addError) throw addError
    console.log('   Resident added to household.')

    // Verify
    const { data: checkMember } = await supabaseAdmin
        .from('members')
        .select('id, status, household_id')
        .eq('user_id', residentId)
        .eq('community_id', community.id)
        .single()

    if (!checkMember) throw new Error('Member not found')
    if (checkMember.household_id !== household.id) throw new Error('Resident not in household')
    console.log('   Verified: Resident is in household.')

    // 3. Simulate Suspend
    console.log('\n3. Testing Suspend...')
    const { error: suspendError } = await supabaseAdmin
        .from('members')
        .update({ status: 'suspended' })
        .eq('id', checkMember.id)
    if (suspendError) throw suspendError

    const { data: suspendedMember } = await supabaseAdmin
        .from('members')
        .select('status')
        .eq('id', checkMember.id)
        .single()

    if (!suspendedMember || suspendedMember.status !== 'suspended') throw new Error('Resident not suspended')
    console.log('   Verified: Resident is suspended.')

    // 4. Simulate Reactivate
    console.log('\n4. Testing Reactivate...')
    const { error: reactivateError } = await supabaseAdmin
        .from('members')
        .update({ status: 'approved' })
        .eq('id', checkMember.id)
    if (reactivateError) throw reactivateError

    const { data: activeMember } = await supabaseAdmin
        .from('members')
        .select('status')
        .eq('id', checkMember.id)
        .single()

    if (!activeMember || activeMember.status !== 'approved') throw new Error('Resident not reactivated')
    console.log('   Verified: Resident is active.')

    // 5. Simulate Remove
    console.log('\n5. Testing Remove (Unassign)...')
    const { error: removeError } = await supabaseAdmin
        .from('members')
        .update({ household_id: null, is_household_head: false })
        .eq('id', checkMember.id)
    if (removeError) throw removeError

    const { data: removedMember } = await supabaseAdmin
        .from('members')
        .select('household_id')
        .eq('id', checkMember.id)
        .single()

    if (!removedMember || removedMember.household_id !== null) throw new Error('Resident not removed from household')
    console.log('   Verified: Resident removed from household.')

    console.log('\nVerification Successful!')
}

verifyResidentManagement().catch(console.error)
