import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 1. Check for Environment Variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        // If missing, we log error but allow request to proceed for public pages
        // This prevents the 500 crash on the landing page
        console.error('Middleware: Missing Supabase environment variables')
        return response
    }

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            request.cookies.set(name, value)
                        )
                        response = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        const {
            data: { user },
        } = await supabase.auth.getUser()

        // 2. Protect Routes
        if (
            !user &&
            request.nextUrl.pathname !== '/' &&
            !request.nextUrl.pathname.startsWith('/login') &&
            !request.nextUrl.pathname.startsWith('/signup') &&
            !request.nextUrl.pathname.startsWith('/auth') &&
            !request.nextUrl.pathname.startsWith('/privacy') &&
            !request.nextUrl.pathname.startsWith('/terms') &&
            !request.nextUrl.pathname.startsWith('/_next') && // Ensure next internal routes are ignored
            !request.nextUrl.pathname.includes('.') // Ignore files (images, etc)
        ) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // 3. Protect Admin Routes
        if (request.nextUrl.pathname.startsWith('/admin') && user) {
            const { data: profile } = await supabase
                .from('profiles' as any)
                .select('is_super_admin')
                .eq('id', user.id)
                .single()

            if (!profile || !(profile as any).is_super_admin) {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
        }

        return response
    } catch (e) {
        console.error('Middleware Error:', e)
        // In case of any error, we return the original response to avoid crashing
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
