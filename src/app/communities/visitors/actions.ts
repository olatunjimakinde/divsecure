'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function generateAccessCode() {
    // Generate a random 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createVisitorCode(formData: FormData) {
    const supabase = await createClient()

    const visitorName = formData.get('visitorName') as string
    const vehiclePlate = formData.get('vehiclePlate') as string
    const validFrom = formData.get('validFrom') as string
    const validUntil = formData.get('validUntil') as string
    const communityId = formData.get('communityId') as string
    const communitySlug = formData.get('communitySlug') as string
    const isOneTime = formData.get('isOneTime') === 'on'
    const maxUses = formData.get('maxUses') ? parseInt(formData.get('maxUses') as string) : null

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const accessCode = generateAccessCode()

    const { error } = await supabase.from('visitor_codes').insert({
        community_id: communityId,
        host_id: user.id,
        visitor_name: visitorName,
        vehicle_plate: vehiclePlate || null,
        access_code: accessCode,
        valid_from: new Date(validFrom).toISOString(),
        valid_until: new Date(validUntil).toISOString(),
        is_one_time: isOneTime,
        max_uses: maxUses,
    } as any)

    if (error) {
        console.error('Error creating visitor code:', error)
        redirect(`/communities/${communitySlug}/visitors?error=Failed to create code`)
    }

    revalidatePath(`/communities/${communitySlug}/visitors`)
    redirect(`/communities/${communitySlug}/visitors`)
}

export async function deleteVisitorCode(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const codeId = formData.get('codeId') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Only allow host to delete their own code
    // We use admin client to bypass RLS, but we MUST verify ownership explicitly
    const { error } = await supabaseAdmin
        .from('visitor_codes')
        .delete()
        .eq('id', codeId)
        .eq('host_id', user.id)

    if (error) {
        console.error('Error deleting visitor code:', error)
        redirect(`/communities/${communitySlug}/visitors?error=Failed to delete code`)
    }

    revalidatePath(`/communities/${communitySlug}/visitors`)
}

export async function toggleVisitorCodeStatus(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const codeId = formData.get('codeId') as string
    const communitySlug = formData.get('communitySlug') as string
    const isActive = formData.get('isActive') === 'true'

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Use admin client to bypass RLS
    const { error } = await supabaseAdmin
        .from('visitor_codes')
        .update({ is_active: isActive })
        .eq('id', codeId)
        .eq('host_id', user.id)

    if (error) {
        console.error('Error updating visitor code status:', error)
        redirect(`/communities/${communitySlug}/visitors?error=Failed to update status`)
    }

    revalidatePath(`/communities/${communitySlug}/visitors`)
}

export async function rescheduleVisitorCode(formData: FormData) {
    console.log('Rescheduling visitor code...')
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const codeId = formData.get('codeId') as string
    const communitySlug = formData.get('communitySlug') as string
    const validFrom = formData.get('validFrom') as string
    const validUntil = formData.get('validUntil') as string

    console.log('Values:', { codeId, communitySlug, validFrom, validUntil })

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Use admin client to bypass RLS
    const { error } = await supabaseAdmin
        .from('visitor_codes')
        .update({
            valid_from: new Date(validFrom).toISOString(),
            valid_until: new Date(validUntil).toISOString(),
        })
        .eq('id', codeId)
        .eq('host_id', user.id)

    if (error) {
        console.error('Error rescheduling visitor code:', error)
        return { error: 'Failed to reschedule code' }
    }

    revalidatePath(`/communities/${communitySlug}/visitors`)
    return { success: true }
}
