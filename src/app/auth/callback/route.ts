import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    console.log('Auth callback params:', Object.fromEntries(searchParams.entries()))
    console.log('Auth callback origin:', origin)
    console.log('Auth callback next:', next)

    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')
    const error_code = searchParams.get('error_code')

    // If Supabase redirected with an error in the query params (PKCE flow issues sometimes)
    if (error) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}&error_code=${encodeURIComponent(error_code || '')}`)
    }

    if (code) {
        const supabase = await createClient()
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
        if (sessionError) {
            console.error('Auth callback error:', sessionError)
            // If code exchange fails, check if we already have a session (e.g. code used but session set)
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                console.log('Session already exists, proceeding.')
            } else {
                return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(sessionError.name || 'AuthError')}&error_description=${encodeURIComponent(sessionError.message)}`)
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
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=InvalidRequest&error_description=No+auth+code+found`)
}
