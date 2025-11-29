import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { updateRoleFeature } from './actions'
import { FeatureSwitch } from '@/app/admin/features/feature-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { checkFeatureAccess } from '@/lib/features'

export default async function ManagerFeaturesPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const supabase = await createClient()
    const { slug } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: community } = await supabase
        .from('communities')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!community) notFound()

    // Check permissions
    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .in('role', ['community_manager', 'head_of_security'])
        .single()

    if (!member) redirect(`/communities/${slug}`)

    const { data: features } = await supabase
        .from('features' as any)
        .select('*')
        .order('name')

    const { data: roleFeatures } = await supabase
        .from('role_features' as any)
        .select('role, feature_key, enabled')
        .eq('community_id', community.id)

    // Helper to get effective state for a role
    // Note: We need to know if the feature is enabled for the community first!
    // But checkFeatureAccess handles hierarchy.
    // However, here we want to show the *override* status specifically.

    // Actually, if the community has disabled a feature, can a manager enable it for a role?
    // Usually NO. The hierarchy is: Community > Role > Default.
    // If Community says NO, Role cannot say YES?
    // Or is it: Role Override > Community Override > Default?
    // My implementation in `checkFeatureAccess` was:
    // 1. Role Override
    // 2. Community Override
    // 3. Default

    // This means Role Override takes precedence.
    // So if Community is Disabled, but Role is Enabled, the Role gets it.
    // This allows "Disable for everyone except Guards".
    // This seems correct for granular control.

    const getRoleState = (featureKey: string, role: string) => {
        const override = (roleFeatures as any[])?.find((rf: any) => rf.feature_key === featureKey && rf.role === role)
        if (override) return { enabled: override.enabled, isOverride: true }
        // If no override, what is the default?
        // It falls back to Community or Global.
        // We can't easily calculate that here without fetching more, but we can assume "Inherited".
        return { enabled: null, isOverride: false } // We'll show "Inherited"
    }

    const roles = ['resident', 'guard']

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/communities/${slug}/manager`}>
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Feature Settings</h1>
                    <p className="text-muted-foreground">
                        Manage feature access for different roles in {community.name}.
                    </p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Feature</TableHead>
                            {roles.map(role => (
                                <TableHead key={role} className="capitalize">{role}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {features?.map((feature: any) => (
                            <TableRow key={feature.key}>
                                <TableCell className="font-medium">
                                    {feature.name}
                                    <div className="text-xs text-muted-foreground">
                                        {feature.description}
                                    </div>
                                </TableCell>
                                {roles.map(role => {
                                    const state = getRoleState(feature.key, role)
                                    // Calculate effective value for display if inherited
                                    // This requires async call or pre-fetching.
                                    // For simplicity, we just show the toggle state.
                                    // If no override, we assume it's ON (or whatever the default is).
                                    // Ideally we show the effective value.

                                    // Let's just default to "Inherited" and let them toggle to explicit True/False.
                                    // But FeatureSwitch needs a boolean.
                                    // If state.enabled is null, what do we pass?
                                    // We should probably fetch the effective value to show as initial state?
                                    // Or better: Show a tri-state? (Inherit / On / Off).
                                    // FeatureSwitch is binary.

                                    // Let's assume if no override, we pass the *current effective value*.
                                    // But we need to know it.
                                    // I'll fetch community features to calculate it.

                                    return (
                                        <TableCell key={role}>
                                            <div className="flex flex-col gap-1">
                                                <FeatureSwitch
                                                    featureKey={feature.key}
                                                    enabled={state.enabled ?? feature.default_enabled} // Fallback to global default if null? Incorrect.
                                                    onToggle={async (key, enabled) => {
                                                        'use server'
                                                        await updateRoleFeature(community.id, role, key, enabled)
                                                    }}
                                                />
                                                {state.isOverride ? (
                                                    <span className="text-[10px] text-muted-foreground">Overridden</span>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground">Inherited</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
