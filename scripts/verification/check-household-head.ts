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

async function checkHouseholdHead() {
    const email = 'justmakinde@gmail.com'
    console.log(`Checking status for ${email}...`)

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.find(u => u.email === email)

    if (!user) {
        console.error('User not found')
        return
    }

    console.log('User ID:', user.id)

    // 2. Get Member Status
    const { data: members, error: memberError } = await supabaseAdmin
        .from('members')
        .select('*, communities(slug)')
        .eq('user_id', user.id)

    if (memberError) {
        console.error('Error fetching members:', memberError)
        return
    }

    console.log('Memberships:', members)

    // 3. Fix if needed
    // We want them to be a household head in at least one community for testing
    if (members && members.length > 0) {
        const member = members[0]
        if (!member.is_household_head) {
            console.log('User is NOT a household head. Updating...')

            // Need to ensure they have a household_id first
            let householdId = member.household_id
            if (!householdId) {
                console.log('User has no household. Creating one...')
                const { data: household, error: hhError } = await supabaseAdmin
                    .from('households')
                    .insert({
                        community_id: member.community_id,
                        name: 'Makinde Household',
                        contact_email: email
                    })
                    .select()
                    .single()

                if (hhError) {
                    console.error('Error creating household:', hhError)
                    return
                }
                householdId = household.id
            }

            const { error: updateError } = await supabaseAdmin
                .from('members')
                .update({
                    is_household_head: true,
                    household_id: householdId
                })
                .eq('id', member.id)

            if (updateError) {
                console.error('Error updating member:', updateError)
            } else {
                console.log('Successfully promoted user to Household Head.')
            }
        } else {
            console.log('User is already a Household Head.')
        }
    } else {
        console.log('User is not a member of any community.')
    }
}

checkHouseholdHead().catch(console.error)
