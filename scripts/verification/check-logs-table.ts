import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
    console.log('Checking visitor_logs table...')
    const { data, error } = await supabase
        .from('visitor_logs')
        .select('count', { count: 'exact', head: true })

    if (error) {
        console.error('Error querying visitor_logs:', error)
    } else {
        console.log('Success! Table exists.')
    }
}

checkTable()
