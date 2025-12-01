import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { approveResidentCore } from '../../src/app/communities/[slug]/manager/actions'
import { changeHouseholdHeadCore } from '../../src/app/communities/households/actions'

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

async function verifyAutoHousehold() {
    console.log('Starting Auto Household Verification...')

    const timestamp = Date.now()
    const slug = `verify-auto-${timestamp}`
    const managerEmail = `manager-${timestamp}@example.com`
    const headEmail = `head-${timestamp}@example.com`
    const residentEmail = `resident-${timestamp}@example.com`
    const unitNumber = `Unit-${timestamp}`

    // 1. Setup Community
    console.log(`\n1. Setting up Community: ${slug}`)
    const { data: { user: managerUser }, error: createManagerError } = await supabaseAdmin.auth.admin.createUser({
        email: managerEmail,
        password: 'password123',
        email_confirm: true
    })
    if (createManagerError) throw createManagerError
    if (!managerUser) throw new Error('Manager user not created')

    const { data: community, error: commError } = await supabaseAdmin
        .from('communities')
        .insert({
            name: 'Auto Household Community',
            slug: slug,
            owner_id: managerUser.id
        })
        .select()
        .single()
    if (commError) throw commError

    // 2. Create Pending Household Head
    console.log(`\n2. Creating Pending Head: ${headEmail}`)
    const { data: { user: headUser }, error: createHeadError } = await supabaseAdmin.auth.admin.createUser({
        email: headEmail,
        password: 'password123',
        email_confirm: true
    })
    if (createHeadError) throw createHeadError
    if (!headUser) throw new Error('Head user not created')

    const { data: headMember, error: joinError } = await supabaseAdmin
        .from('members')
        .insert({
            community_id: community.id,
            user_id: headUser.id,
            role: 'resident',
            status: 'pending',
            unit_number: unitNumber,
            is_household_head: true
        })
        .select()
        .single()
    if (joinError) throw joinError

    // 3. Approve Head (Using Actual Logic)
    console.log('\n3. Approving Head (Calling approveResidentCore)...')

    const approveResult = await approveResidentCore(supabaseAdmin, headMember.id, community.id)
    if (approveResult?.error) throw approveResult.error

    // 4. Verify Household Creation and Link
    console.log('\n4. Verifying Household Link...')
    const { data: updatedHead } = await supabaseAdmin
        .from('members')
        .select('household_id, is_household_head')
        .eq('id', headMember.id)
        .single()

    if (!updatedHead) throw new Error('Head member not found')
    if (!updatedHead.household_id) throw new Error('Head not linked to household')
    if (!updatedHead.is_household_head) throw new Error('Head lost head status')
    console.log('   Verified: Head linked to household.')

    const householdId = updatedHead.household_id

    // 5. Test Change Head
    console.log('\n5. Testing Change Head...')
    // Create another resident
    const { data: { user: residentUser } } = await supabaseAdmin.auth.admin.createUser({
        email: residentEmail,
        password: 'password123',
        email_confirm: true
    })
    if (!residentUser) throw new Error('Resident user not created')

    const { data: residentMember } = await supabaseAdmin
        .from('members')
        .insert({
            community_id: community.id,
            user_id: residentUser.id,
            role: 'resident',
            status: 'approved',
            household_id: householdId,
            is_household_head: false
        })
        .select()
        .single()

    // Call changeHouseholdHeadCore
    const changeResult = await changeHouseholdHeadCore(supabaseAdmin, householdId, residentMember.id)
    if (changeResult?.error) throw changeResult.error

    // Verify Swap
    const { data: oldHeadCheck } = await supabaseAdmin.from('members').select('is_household_head').eq('id', headMember.id).single()
    if (!oldHeadCheck) throw new Error('Old head member not found')
    const { data: newHeadCheck } = await supabaseAdmin.from('members').select('is_household_head').eq('id', residentMember.id).single()
    if (!newHeadCheck) throw new Error('New head member not found')

    if (oldHeadCheck.is_household_head) throw new Error('Old head still head')
    if (!newHeadCheck.is_household_head) throw new Error('New head not set')

    console.log('   Verified: Head swapped successfully.')

    console.log('\nVerification Successful!')
}

verifyAutoHousehold().catch(console.error)
