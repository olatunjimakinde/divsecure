import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUserRole() {
    const communitySlug = 'lekki-phase1' // Hardcoded for now based on previous context

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

    // 2. Get all members to see what we have
    const { data: members } = await supabase
        .from('members')
        .select(`
            id,
            user_id,
            role,
            profiles(email)
        `)
        .eq('community_id', community.id)

    console.log('Members in community:', JSON.stringify(members, null, 2))
}

checkUserRole()
