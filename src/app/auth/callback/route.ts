import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    console.log('Auth callback params:', Object.fromEntries(searchParams.entries()))
    console.log('Auth callback origin:', origin)
    console.log('Auth callback next:', next)

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
            console.error('Auth callback error:', error)
            // If code exchange fails, check if we already have a session (e.g. code used but session set)
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                console.log('Session already exists, proceeding.')
            } else {
                return NextResponse.redirect(`${origin}/auth/auth-code-error`)
            }
        }

        const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
        const isLocalEnv = process.env.NODE_ENV === 'development'

        let redirectUrl = ''
        if (isLocalEnv) {
            // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
            redirectUrl = `${origin}${next}`
        } else if (forwardedHost) {
            redirectUrl = `https://${forwardedHost}${next}`
        } else {
            redirectUrl = `${origin}${next}`
        }

        console.log('Auth callback redirecting to:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
