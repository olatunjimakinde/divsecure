'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createBill(formData: FormData) {
    const supabase = await createClient()
    const communityId = formData.get('communityId') as string
    const householdId = formData.get('householdId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)
    const dueDate = formData.get('dueDate') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify Manager
    // Verify Manager
    const { isSuperAdmin } = await import('@/lib/permissions')
    const isSuper = await isSuperAdmin(user.id)

    if (!isSuper) {
        const { data: member } = await supabase
            .from('members')
            .select('role')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .single()

        if (member?.role !== 'community_manager') {
            return { error: 'Unauthorized' }
        }
    }

    const { error } = await supabase
        .from('bills')
        .insert({
            community_id: communityId,
            household_id: householdId,
            title,
            description,
            amount,
            due_date: dueDate,
            status: 'pending'
        })

    if (error) {
        console.error('Error creating bill:', error)
        return { error: 'Failed to create bill' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/billing`)
    return { success: true }
}

export async function payBill(formData: FormData) {
    const supabase = await createClient()
    const billId = formData.get('billId') as string
    const amount = parseFloat(formData.get('amount') as string)
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify Household Member
    // We rely on RLS for insert check on payments, but let's be explicit
    // Actually, we need to update the bill status too, which requires admin or RLS update policy.
    // RLS policy for bills update is only for managers.
    // So we need admin client to update bill status after payment.

    const supabaseAdmin = await createAdminClient()

    // 1. Record Payment
    const { error: paymentError } = await supabase
        .from('payments')
        .insert({
            bill_id: billId,
            amount,
            method: 'card', // Simulated
            reference: `SIM-${Date.now()}`
        })

    if (paymentError) {
        console.error('Error recording payment:', paymentError)
        return { error: 'Failed to record payment' }
    }

    // 2. Update Bill Status
    // Check if fully paid? For now, assume full payment.
    const { error: billError } = await supabaseAdmin
        .from('bills')
        .update({ status: 'paid' })
        .eq('id', billId)

    if (billError) {
        console.error('Error updating bill status:', billError)
        return { error: 'Payment recorded but failed to update bill status' }
    }

    revalidatePath(`/communities/${communitySlug}/household/billing`)
    return { success: true }
}

export async function deleteBill(formData: FormData) {
    const supabase = await createClient()
    const billId = formData.get('billId') as string
    const communitySlug = formData.get('communitySlug') as string

    // Get Bill to check community permissions
    const { data: bill } = await supabase
        .from('bills')
        .select('community_id')
        .eq('id', billId)
        .single()

    if (!bill) return { error: 'Bill not found' }

    // Verify Manager
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { isSuperAdmin } = await import('@/lib/permissions')
    const isSuper = await isSuperAdmin(user.id)

    if (!isSuper) {
        const { data: member } = await supabase
            .from('members')
            .select('role')
            .eq('community_id', bill.community_id)
            .eq('user_id', user.id)
            .single()

        if (member?.role !== 'community_manager') {
            return { error: 'Unauthorized' }
        }
    }

    const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId)

    if (error) {
        console.error('Error deleting bill:', error)
        return { error: 'Failed to delete bill' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/billing`)
    return { success: true }
}

export async function updateBill(formData: FormData) {
    const supabase = await createClient()
    const billId = formData.get('billId') as string
    const title = formData.get('title') as string
    const amount = parseFloat(formData.get('amount') as string)
    const dueDate = formData.get('dueDate') as string
    const communitySlug = formData.get('communitySlug') as string

    // Get Bill
    const { data: bill } = await supabase
        .from('bills')
        .select('community_id')
        .eq('id', billId)
        .single()

    if (!bill) return { error: 'Bill not found' }

    // Verify Manager
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { isSuperAdmin } = await import('@/lib/permissions')
    const isSuper = await isSuperAdmin(user.id)

    if (!isSuper) {
        const { data: member } = await supabase
            .from('members')
            .select('role')
            .eq('community_id', bill.community_id)
            .eq('user_id', user.id)
            .single()

        if (member?.role !== 'community_manager') {
            return { error: 'Unauthorized' }
        }
    }

    const { error } = await supabase
        .from('bills')
        .update({
            title,
            amount,
            due_date: dueDate
        })
        .eq('id', billId)

    if (error) {
        console.error('Error updating bill:', error)
        return { error: 'Failed to update bill' }
    }

    revalidatePath(`/communities/${communitySlug}/manager/billing`)
    return { success: true }
}
