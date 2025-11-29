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

async function fixCurrentUser() {
    const targetUserId = '11bf5baf-e7d9-4af1-aff1-a8b3572ff365'
    console.log(`Fixing status for User ID: ${targetUserId}...`)

    // 1. Get Member Status
    const { data: members, error: memberError } = await supabaseAdmin
        .from('members')
        .select('*, communities(slug)')
        .eq('user_id', targetUserId)

    if (memberError) {
        console.error('Error fetching members:', memberError)
        return
    }

    console.log('Memberships:', members)

    if (members && members.length > 0) {
        const member = members[0]

        // Check if household exists
        let householdId = member.household_id
        if (!householdId) {
            console.log('User has no household. Creating one...')
            // Get user email for household name
            const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(targetUserId)
            const email = user?.email || 'Unknown'

            const { data: household, error: hhError } = await supabaseAdmin
                .from('households')
                .insert({
                    community_id: member.community_id,
                    name: `${email}'s Household`,
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
        console.log('User is not a member of any community.')
    }
}

fixCurrentUser().catch(console.error)
