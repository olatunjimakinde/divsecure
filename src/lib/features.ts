import { createClient } from '@/lib/supabase/server'

export async function checkFeatureAccess(
    communityId: string,
    role: string,
    featureKey: string
): Promise<boolean> {
    const supabase = await createClient()

    // 1. Check Role Override
    const { data: roleFeature } = await supabase
        .from('role_features' as any)
        .select('enabled')
        .eq('community_id', communityId)
        .eq('role', role)
        .eq('feature_key', featureKey)
        .single()

    if (roleFeature) return (roleFeature as any).enabled

    // 2. Check Community Override
    const { data: communityFeature } = await supabase
        .from('community_features' as any)
        .select('enabled')
        .eq('community_id', communityId)
        .eq('feature_key', featureKey)
        .single()

    if (communityFeature) return (communityFeature as any).enabled

    // 3. Check Default
    const { data: feature } = await supabase
        .from('features' as any)
        .select('default_enabled')
        .eq('key', featureKey)
        .single()

    return (feature as any)?.default_enabled ?? false
}

export async function getFeatures() {
    const supabase = await createClient()
    const { data } = await supabase.from('features' as any).select('*')
    return data || []
}
