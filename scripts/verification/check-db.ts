import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumn() {
    const { data, error } = await supabase
        .from('visitor_codes')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error:', error)
        return
    }

    if (data && data.length > 0) {
        const row = data[0]
        console.log('Columns:', Object.keys(row))
        console.log('Has is_active:', 'is_active' in row)
    } else {
        console.log('No data in visitor_codes to check columns')
    }
}

checkColumn()
