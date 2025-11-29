import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS for testing

const supabase = createClient(supabaseUrl, supabaseKey)

async function testHouseholds() {
    console.log('Starting Household Verification...')

    // 1. Get a community
    const { data: community } = await supabase
        .from('communities')
        .select('id, slug')
        .limit(1)
        .single()

    if (!community) {
        console.error('No community found. Cannot test.')
        return
    }
    console.log('Using community:', community.slug)

    // 2. Create a Household
    const householdName = `Test Unit ${Date.now()}`
    const { data: household, error: createError } = await supabase
        .from('households')
        .insert({
            community_id: community.id,
            name: householdName,
            contact_email: 'test@example.com'
        })
        .select()
        .single()

    if (createError) {
        console.error('Failed to create household:', createError)
        return
    }
    console.log('✅ Created household:', household.name)

    // 3. Get a resident member
    const { data: member } = await supabase
        .from('members')
        .select('id, user_id')
        .eq('community_id', community.id)
        .eq('role', 'resident')
        .limit(1)
        .single()

    if (!member) {
        console.log('⚠️ No resident found to test assignment. Skipping assignment test.')
    } else {
        // 4. Assign member to household
        const { error: assignError } = await supabase
            .from('members')
            .update({ household_id: household.id })
            .eq('id', member.id)

        if (assignError) {
            console.error('Failed to assign member:', assignError)
        } else {
            console.log('✅ Assigned member to household')

            // Verify assignment
            const { data: verifiedMember } = await supabase
                .from('members')
                .select('household_id')
                .eq('id', member.id)
                .single()

            if (verifiedMember?.household_id === household.id) {
                console.log('✅ Verification successful: Member is linked to household')
            } else {
                console.error('❌ Verification failed: Member not linked')
            }

            // 5. Remove member
            await supabase
                .from('members')
                .update({ household_id: null })
                .eq('id', member.id)
            console.log('✅ Removed member from household')
        }
    }

    // 6. Delete Household
    const { error: deleteError } = await supabase
        .from('households')
        .delete()
        .eq('id', household.id)

    if (deleteError) {
        console.error('Failed to delete household:', deleteError)
    } else {
        console.log('✅ Deleted household')
    }

    console.log('Test Complete.')
}

testHouseholds()
