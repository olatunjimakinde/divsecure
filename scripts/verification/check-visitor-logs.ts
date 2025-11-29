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

async function applyMigration() {
    console.log('Applying visitor_logs migration...')

    // Read migration file
    const migrationPath = resolve(__dirname, 'supabase/migrations/20240525000001_add_visitor_logs.sql')
    const sql = readFileSync(migrationPath, 'utf8')

    // Execute SQL
    // Note: supabase-js doesn't support raw SQL execution directly on the client usually, 
    // but we can use the rpc 'exec_sql' if we had one, or just use the postgres connection string if we had it.
    // Wait, we don't have direct DB access.
    // But we can use the `pg` library if we have the connection string? 
    // We don't have the connection string in .env.local usually, just the URL and Key.

    // Alternative: We can try to use the `supabase` CLI with the db url if we can find it?
    // Or we can assume the table might be missing and just try to create it via a special edge function? No.

    // Actually, the user said "Error fetching visitor history: {}".
    // This might be RLS.
    // Let's first CHECK if the table exists using the admin client.

    const { error } = await supabaseAdmin.from('visitor_logs').select('id').limit(1)

    if (error) {
        console.error('Error checking visitor_logs table:', JSON.stringify(error, null, 2))
        if (error.code === '42P01') { // undefined_table
            console.log('Table visitor_logs does NOT exist.')
        }
    } else {
        console.log('Table visitor_logs exists.')
    }
}

applyMigration().catch(console.error)
