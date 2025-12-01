import { createClient } from '@/lib/supabase/server'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function initializeTransaction(email: string, amount: number, callbackUrl: string, metadata: Record<string, any> = {}) {
    if (!PAYSTACK_SECRET_KEY) {
        throw new Error('PAYSTACK_SECRET_KEY is not defined')
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            amount: amount * 100, // Paystack expects amount in kobo
            callback_url: callbackUrl,
            metadata,
        }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to initialize transaction')
    }

    return response.json()
}

export async function verifyTransaction(reference: string) {
    if (!PAYSTACK_SECRET_KEY) {
        throw new Error('PAYSTACK_SECRET_KEY is not defined')
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
    })

    if (!response.ok) {
        throw new Error('Failed to verify transaction')
    }

    return response.json()
}
