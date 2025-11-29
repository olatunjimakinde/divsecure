import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function listHouseholds() {
    const communitySlug = 'lekki-phase1'

    // 1. Get Community ID
    const { data: community } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', communitySlug)
        .single()

    if (!community) {
        console.error('Community not found')
        return
    }

    // 2. List Households
    const { data: households, error } = await supabase
        .from('households')
        .select('*')
        .eq('community_id', community.id)

    if (error) {
        console.error('Error fetching households:', error)
    } else {
        console.log(`Found ${households.length} households:`)
        console.log(JSON.stringify(households, null, 2))
    }
}

listHouseholds()
