import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

export function createClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('Supabase Client Error: Missing environment variables')
        // Return a dummy client to prevent crash, but auth will fail
        return createBrowserClient<Database>(
            'https://placeholder.supabase.co',
            'placeholder'
        )
    }

    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
}
