'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';

export async function createMaintenanceRequest(
    communityId: string,
    data: {
        title: string;
        description: string;
        priority: MaintenancePriority;
        unitNumber?: string;
        images?: string[];
    }
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    // @ts-ignore
    const { error } = await supabase.from('maintenance_requests').insert({
        community_id: communityId,
        reporter_id: user.id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        unit_number: data.unitNumber,
        images: data.images || [],
    });

    if (error) {
        console.error('Error creating maintenance request:', error);
        return { error: error.message };
    }

    revalidatePath(`/communities/${communityId}/maintenance`);
    revalidatePath(`/communities/${communityId}/manager/maintenance`);
    return { success: true };
}

export async function getMaintenanceRequests(communityId: string, isManager: boolean = false) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized', data: [] };
    }

    let query = supabase
        // @ts-ignore
        .from('maintenance_requests')
        .select('*, reporter:profiles(full_name, email, phone)')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

    // If not manager, strictly filter by own ID (redundant with RLS but good for optimization/safety)
    if (!isManager) {
        query = query.eq('reporter_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching maintenance requests:', error);
        return { error: error.message, data: [] };
    }

    console.log('Fetched Requests:', { communityId, userId: user.id, count: data?.length, isManager });
    return { success: true, data };
}

export async function updateMaintenanceStatus(
    requestId: string,
    communitySlug: string,
    status: MaintenanceStatus
) {
    const supabase = await createClient();

    // Verify manager permissions implicitly via RLS, but explicit check is better for UX feedback
    const { error } = await supabase
        // @ts-ignore
        .from('maintenance_requests')
        .update({ status: status as any })
        .eq('id', requestId);

    if (error) {
        console.error('Error updating maintenance status:', error);
        return { error: error.message };
    }

    revalidatePath(`/communities/${communitySlug}/maintenance`);
    revalidatePath(`/communities/${communitySlug}/manager/maintenance`);
    return { success: true };
}
