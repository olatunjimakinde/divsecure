import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
    const { data, error } = await supabase
        .from('households')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error checking households table:', error)
    } else {
        console.log('Households table exists. Data:', data)
    }

    const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('household_id')
        .limit(1)

    if (membersError) {
        console.error('Error checking members table for household_id:', membersError)
    } else {
        console.log('Members table has household_id column (checked via select).')
    }
}

checkTable()
