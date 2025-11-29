'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login failed for email:', email, 'Error:', error)
        redirect('/login?message=' + encodeURIComponent(error.message))
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const phone = formData.get('phone') as string
    const role = formData.get('role') as string

    // Resident fields
    const communityId = formData.get('communityId') as string
    const unitNumber = formData.get('unitNumber') as string

    // Manager fields
    const communityName = formData.get('communityName') as string
    const communityAddress = formData.get('communityAddress') as string

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
            data: {
                full_name: email.split('@')[0], // Default name from email
                phone: phone,
            }
        },
    })

    if (authError) {
        redirect('/signup?message=Could not create user: ' + authError.message)
    }

    if (!authData.user) {
        redirect('/signup?message=Something went wrong')
    }

    // 2. Handle Role-Specific Logic
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
        redirect('/signup?message=Server configuration error: Missing Service Role Key')
    }

    // Use admin client because the user is not yet verified/logged in
    const supabaseAdmin = await createAdminClient()

    if (role === 'household') {
        if (!communityId || !unitNumber) {
            console.error('Missing household fields')
            return
        }

        const { error: memberError } = await supabaseAdmin.from('members').insert({
            community_id: communityId,
            user_id: authData.user.id,
            role: 'resident',
            status: 'pending',
            unit_number: unitNumber,
            is_household_head: true
        })

        if (memberError) {
            console.error('Error creating resident member:', memberError)
        }

    } else if (role === 'manager') {
        const communitySlug = formData.get('communitySlug') as string

        if (!communityName || !communityAddress || !communitySlug) {
            console.error('Missing manager fields')
            return
        }

        // Create Community
        const { data: community, error: communityError } = await supabaseAdmin
            .from('communities')
            .insert({
                name: communityName,
                slug: communitySlug,
                address: communityAddress,
                owner_id: authData.user.id
            })
            .select()
            .single()

        if (communityError) {
            console.error('Error creating community:', communityError)
            return
        }

        // Join as Manager (Approved)
        const { error: memberError } = await supabaseAdmin.from('members').insert({
            community_id: community.id,
            user_id: authData.user.id,
            role: 'community_manager',
            status: 'approved'
        })

        if (memberError) {
            console.error('Error joining as manager:', memberError)
        }
    }

    revalidatePath('/', 'layout')
    redirect('/login?success=Please check your email to confirm your account.')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function signInWithGoogle() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
        },
    })

    if (error) {
        redirect('/login?error=Could not authenticate with Google')
    }

    if (data.url) {
        redirect(data.url)
    }
}

export async function signInAsDemoUser() {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@example.com',
        password: 'password123',
    })

    if (error) {
        redirect('/login?message=Demo user not configured')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        redirect('/update-password?error=Passwords do not match')
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
    })

    if (error) {
        console.error('Error updating password:', error)
        redirect('/update-password?error=Could not update password')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
