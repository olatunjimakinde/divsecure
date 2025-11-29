'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { parse } from 'csv-parse/sync'

export async function uploadHouseholdsCSV(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const file = formData.get('file') as File
    const communityId = formData.get('communityId') as string
    const communitySlug = formData.get('communitySlug') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    if (!file) {
        return { error: 'No file uploaded' }
    }

    try {
        const text = await file.text()
        const records = parse(text, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as { name: string; contact_email?: string }[]

        // Expected columns: name, contact_email (optional)
        const households = []
        const errors = []

        for (const record of records) {
            if (!record.name) {
                errors.push(`Row missing name: ${JSON.stringify(record)}`)
                continue
            }

            households.push({
                community_id: communityId,
                name: record.name,
                contact_email: record.contact_email || null,
            })
        }

        if (households.length === 0) {
            return { error: 'No valid households found in CSV' }
        }

        if (households.length > 100) {
            return { error: 'Cannot upload more than 100 households at once' }
        }

        const { error } = await supabaseAdmin
            .from('households')
            .insert(households)

        if (error) {
            console.error('Error inserting households:', error)
            return { error: 'Failed to create households from CSV' }
        }

        revalidatePath(`/communities/${communitySlug}/manager/households`)
        return { success: true, count: households.length, errors: errors.length > 0 ? errors : undefined }

    } catch (e) {
        console.error('Error parsing CSV:', e)
        return { error: 'Failed to parse CSV file' }
    }
}
