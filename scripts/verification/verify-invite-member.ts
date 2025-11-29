
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { inviteMemberToHousehold } from './src/app/communities/households/actions'

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

// Mock FormData
class MockFormData {
    private data: Record<string, string> = {}
    append(key: string, value: string) {
        this.data[key] = value
    }
    get(key: string) {
        return this.data[key]
    }
}

async function verifyInviteMember() {
    console.log('Starting Invite Member Verification...')

    const timestamp = Date.now()
    const slug = `verify-invite-${timestamp}`
    const managerEmail = `manager+${timestamp}@gmail.com`
    const newResidentEmail = `new+${timestamp}@gmail.com`
    const existingResidentEmail = `existing+${timestamp}@gmail.com`
    const householdName = `Unit-${timestamp}`

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
            name: 'Invite Verification Community',
            slug: slug,
            owner_id: managerUser.id
        })
        .select()
        .single()
    if (commError) throw commError

    // Create Manager Member
    await supabaseAdmin.from('members').insert({
        community_id: community.id,
        user_id: managerUser.id,
        role: 'community_manager',
        status: 'approved'
    })

    // 2. Create Household
    console.log(`\n2. Creating Household: ${householdName}`)
    const { data: household, error: hhError } = await supabaseAdmin
        .from('households')
        .insert({
            community_id: community.id,
            name: householdName
        })
        .select()
        .single()
    if (hhError) throw hhError

    // 3. Test Invite New User
    console.log(`\n3. Inviting New User: ${newResidentEmail}`)

    const { inviteMemberToHouseholdCore } = require('./src/app/communities/households/actions')

    const inviteResult = await inviteMemberToHouseholdCore(supabaseAdmin, community.id, household.id, newResidentEmail)
    if (inviteResult?.error) throw new Error(inviteResult.error)

    // Verify New User Member
    const { data: newMemberProfile } = await supabaseAdmin.from('profiles').select('id').eq('email', newResidentEmail).single()
    if (!newMemberProfile) throw new Error('New user profile not found')

    const { data: newMember } = await supabaseAdmin
        .from('members')
        .select('household_id, status')
        .eq('user_id', newMemberProfile.id)
        .eq('community_id', community.id)
        .single()

    if (!newMember) throw new Error('New member record not found')
    if (newMember.household_id !== household.id) throw new Error('New member not in household')
    if (newMember.status !== 'approved') throw new Error('New member not approved')
    console.log('   Verified: New user invited and linked.')

    // 4. Test Invite Existing User (Unassigned)
    console.log(`\n4. Inviting Existing Unassigned User: ${existingResidentEmail}`)

    // Create user and unassigned member first
    const { data: { user: existingUser }, error: createExistingError } = await supabaseAdmin.auth.admin.createUser({
        email: existingResidentEmail,
        password: 'password123',
        email_confirm: true
    })
    if (createExistingError) throw createExistingError
    if (!existingUser) throw new Error('Existing user not created')

    await supabaseAdmin.from('members').insert({
        community_id: community.id,
        user_id: existingUser.id,
        role: 'resident',
        status: 'approved',
        household_id: null // Unassigned
    })

    // Call Invite
    const inviteExistingResult = await inviteMemberToHouseholdCore(supabaseAdmin, community.id, household.id, existingResidentEmail)
    if (inviteExistingResult?.error) throw new Error(inviteExistingResult.error)

    // Verify Existing User Member
    const { data: existingMember } = await supabaseAdmin
        .from('members')
        .select('household_id')
        .eq('user_id', existingUser.id)
        .eq('community_id', community.id)
        .single()

    if (!existingMember) throw new Error('Existing member record not found')
    if (existingMember.household_id !== household.id) throw new Error('Existing member not linked to household')
    console.log('   Verified: Existing unassigned user linked.')

    console.log('\nVerification Successful!')
}

verifyInviteMember().catch(console.error)
