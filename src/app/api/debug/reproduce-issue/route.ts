
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabaseAdmin = await createAdminClient()
    const supabase = await createClient()

    try {
        // 1. Create a random test user
        const email = `test-resident-${Date.now()}@example.com`
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true, // Auto confirm email to skip email verification? 
            // Wait, we want to test INVITE flow.
            // But inviteUserByEmail sends an email.
            // Let's use generateLink instead.
        })

        if (createError) {
            return NextResponse.json({ step: 'create_user', error: createError }, { status: 500 })
        }

        const userId = userData.user.id
        console.log('Created test user:', userId, email)

        // 2. Generate Invite Link
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email,
        })

        if (linkError) {
            return NextResponse.json({ step: 'generate_link', error: linkError }, { status: 500 })
        }

        const { properties } = linkData
        const token_hash = (properties as any).token_hash || (properties as any).hashed_token

        console.log('Generated Invite Link properties:', linkData.properties)

        if (!token_hash) {
            // Fallback: extract from action_link if possible
            const action_link = (properties as any).action_link
            if (action_link) {
                const url = new URL(action_link)
                // token_hash might be in search params
                const extracted = url.searchParams.get('token_hash') || url.searchParams.get('token')
                if (extracted) {
                    // If it's 'token', it might not be hashed yet? No, from generateLink it should be ready to use? 
                    // Actually generateLink with type invite usually returns a link with token_hash.
                    // Let's just log and fail if missing.
                }
            }
            if (!token_hash) return NextResponse.json({ step: 'generate_link', error: 'Could not find token_hash in properties', properties }, { status: 500 })
        }

        // 3. Simulate VerifyInvite (Server Side)
        // We use the standard client (not admin) to verify
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'invite',
        })

        if (verifyError) {
            return NextResponse.json({ step: 'verify_otp', error: verifyError }, { status: 500 })
        }

        console.log('Verified OTP. User:', verifyData.user?.id)
        console.log('Session present:', !!verifyData.session)

        // 4. Simulate UpdatePassword (using the SAME client instance which should have session)
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
            password: 'NewPassword123!',
        })

        if (updateError) {
            return NextResponse.json({ step: 'update_pass', error: updateError }, { status: 500 })
        }

        // Cleanup
        await supabaseAdmin.auth.admin.deleteUser(userId)

        return NextResponse.json({
            success: true,
            message: 'Flow reproduced successfully in single request',
            user_id: userId,
            verify_session: !!verifyData.session,
            update_data: !!updateData.user
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
    }
}
