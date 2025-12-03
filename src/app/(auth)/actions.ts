'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema } from '@/lib/schemas'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const validation = loginSchema.safeParse(rawData)

    if (!validation.success) {
        const errorMessage = validation.error.issues[0].message
        redirect('/login?message=' + encodeURIComponent(errorMessage))
    }

    const { email, password } = validation.data

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

    const rawData = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        phone: formData.get('phone') as string,
        role: formData.get('role') as string,
        communityId: formData.get('communityId') as string,
        unitNumber: formData.get('unitNumber') as string,
        communityName: formData.get('communityName') as string,
        communityAddress: formData.get('communityAddress') as string,
    }

    const validation = signupSchema.safeParse(rawData)

    if (!validation.success) {
        const errorMessage = validation.error.issues[0].message
        redirect('/signup?message=' + encodeURIComponent(errorMessage))
    }

    const { email, password, phone, role, communityId, unitNumber } = validation.data

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=${encodeURIComponent('/login?success=Email confirmed. Please login to subscribe.')}`,
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
        // Manager signup - just create the user, no community yet
        // They will subscribe and create community later
        console.log('Manager signed up, redirecting to dashboard for subscription')
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
