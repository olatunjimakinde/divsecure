
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugVisitorCodes() {
    console.log('--- Debugging Visitor Codes ---')

    const { data: codes, error } = await supabase
        .from('visitor_codes')
        .select(`
            *,
            communities (name, slug),
            profiles:host_id (full_name, email)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching codes:', error)
        return
    }

    console.log(`Found ${codes.length} visitor codes:`)
    codes.forEach(code => {
        console.log(`
ID: ${code.id}
Community: ${code.communities?.name} (${code.communities?.slug})
Host: ${code.profiles?.full_name} (${code.profiles?.email})
Access Code: '${code.access_code}' (Length: ${code.access_code.length})
Active: ${code.is_active}
Valid: ${new Date(code.valid_from).toLocaleString()} - ${new Date(code.valid_until).toLocaleString()}
One Time: ${code.is_one_time}
Used At: ${code.used_at ? new Date(code.used_at).toLocaleString() : 'Never'}
        `)
    })
}

debugVisitorCodes()
