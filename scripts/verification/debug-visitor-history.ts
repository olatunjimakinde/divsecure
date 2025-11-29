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

async function debugVisitorHistory() {
    console.log('Starting Visitor History Debug...')

    // 1. Create a test resident and community
    const timestamp = Date.now()
    const email = `debug-resident-${timestamp}@example.com`
    const password = 'password123'

    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    })
    if (createError) throw createError
    if (!user) throw new Error('User not created')

    // Create Community
    const { data: community, error: commError } = await supabaseAdmin
        .from('communities')
        .insert({
            name: `Debug Community ${timestamp}`,
            slug: `debug-comm-${timestamp}`,
            owner_id: user.id // Doesn't matter
        })
        .select()
        .single()
    if (commError) throw commError

    // Add member
    await supabaseAdmin.from('members').insert({
        community_id: community.id,
        user_id: user.id,
        role: 'resident',
        status: 'approved'
    })

    // 2. Login as resident
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { session }, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    })
    if (loginError) throw loginError

    // 3. Debug Steps
    console.log('\n--- Debugging ---')

    // A. Admin Fetch Logs
    console.log('A. Admin fetching logs...')
    const { error: adminError } = await supabaseAdmin.from('visitor_logs').select('id').limit(1)
    if (adminError) console.error('Admin Fetch Error:', adminError)
    else console.log('Admin Fetch Success')

    // B. Client Fetch Codes (Simple)
    console.log('B. Client fetching visitor_codes...')
    const { error: codesError } = await supabaseClient.from('visitor_codes').select('id').limit(1)
    if (codesError) console.error('Client Codes Error:', codesError)
    else console.log('Client Codes Success')

    // C. Client Fetch Logs (Simple)
    console.log('C. Client fetching visitor_logs (Simple)...')
    const { error: simpleLogsError } = await supabaseClient.from('visitor_logs').select('id').limit(1)
    if (simpleLogsError) console.error('Client Simple Logs Error:', simpleLogsError)
    else console.log('Client Simple Logs Success')

    // D. Client Fetch Logs (Complex)
    console.log('D. Client fetching logs (Complex)...')
    const { data: logs, error } = await supabaseClient
        .from('visitor_logs')
        .select(`
            id,
            entered_at,
            entry_point,
            visitor_codes!inner (
                visitor_name,
                vehicle_plate,
                access_code
            )
        `)
        .eq('community_id', community.id)
        .order('entered_at', { ascending: false })

    if (error) {
        console.error('Client Complex Logs Error:', JSON.stringify(error, null, 2))
    } else {
        console.log('Client Complex Logs Success')
    }
}

debugVisitorHistory().catch(console.error)
