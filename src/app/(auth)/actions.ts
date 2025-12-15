'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema } from '@/lib/schemas'
import { getURL } from '@/lib/utils'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const getValue = (key: string) => {
        const value = formData.get(key)
        if (value === null || value === '') return undefined
        return String(value)
    }

    const rawData = {
        email: getValue('email'),
        password: getValue('password'),
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

    const getValue = (key: string) => {
        const value = formData.get(key)
        if (value === null || value === '') return undefined
        return String(value)
    }

    const rawData = {
        email: getValue('email'),
        password: getValue('password'),
        phone: getValue('phone'),
        role: getValue('role'),
        communityId: getValue('communityId'),
        unitNumber: getValue('unitNumber'),
        communityName: getValue('communityName'),
        communityAddress: getValue('communityAddress'),
    }

    console.log('DEBUG SIGNUP RAW DATA:', JSON.stringify(rawData, null, 2))

    const validation = signupSchema.safeParse(rawData)

    if (!validation.success) {
        const errorMessage = validation.error.issues[0].message
        redirect('/signup?message=' + encodeURIComponent(errorMessage))
    }

    const { email, password, phone, role, communityId, unitNumber } = validation.data

    // 1. Create Auth User
    const verifyEmailUrl = `/verify-email?email=${encodeURIComponent(email)}`
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${getURL()}auth/callback?next=${encodeURIComponent(verifyEmailUrl)}`,
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
    redirect(`/login?success=${encodeURIComponent('Account created! Please check your email and click the verification link to activate your account.')}`)
}

export async function verifyEmailOtp(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const token = formData.get('code') as string

    if (!email || !token) {
        redirect('/verify-email?error=Missing email or code')
    }

    const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
    })

    if (error) {
        console.error('Error verifying OTP:', error)
        redirect(`/verify-email?email=${encodeURIComponent(email)}&error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function verifyInvite(formData: FormData) {
    const supabase = await createClient()

    const token_hash = formData.get('token_hash') as string
    const type = formData.get('type') as any
    const next = formData.get('next') as string || '/dashboard'

    if (!token_hash || !type) {
        redirect('/auth/auth-code-error?error=Missing token or type')
    }

    const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type,
    })

    if (error) {
        console.error('Error verifying invite:', error)
        redirect(`/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect(next)
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
            redirectTo: `${getURL()}auth/callback`,
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

    const getValue = (key: string) => {
        const value = formData.get(key)
        if (value === null || value === '') return undefined
        return String(value)
    }

    const password = getValue('password') || ''
    const confirmPassword = getValue('confirmPassword') || ''

    if (password !== confirmPassword) {
        redirect('/update-password?error=Passwords do not match')
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
    })

    if (error) {
        console.error('Error updating password:', error)
        redirect(`/update-password?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
