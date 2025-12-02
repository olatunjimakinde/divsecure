import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const envVars = Object.keys(process.env).sort()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (Hidden)' : 'Missing'

    return NextResponse.json({
        message: 'Environment Variables Debug',
        supabaseUrl: supabaseUrl || 'Missing',
        supabaseKeyStatus: supabaseKey,
        allKeys: envVars
    })
}
