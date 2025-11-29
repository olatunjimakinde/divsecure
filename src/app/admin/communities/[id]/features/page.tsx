import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { updateCommunityFeature } from './actions'
import { FeatureSwitch } from '../../../features/feature-switch'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function CommunityFeaturesPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const { id } = await params

    const { data: community } = await supabase
        .from('communities')
        .select('name')
        .eq('id', id)
        .single()

    const { data: features } = await supabase
        .from('features' as any)
        .select('*')
        .order('name')

    const { data: communityFeatures } = await supabase
        .from('community_features' as any)
        .select('feature_key, enabled')
        .eq('community_id', id)

    // Helper to get effective state
    const getEffectiveState = (feature: any) => {
        const override = (communityFeatures as any[])?.find((cf: any) => cf.feature_key === feature.key)
        if (override) return { enabled: override.enabled, isOverride: true }
        return { enabled: feature.default_enabled, isOverride: false }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/communities">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {community?.name}: Features
                    </h1>
                    <p className="text-muted-foreground">
                        Override global feature availability for this community.
                    </p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Feature</TableHead>
                            <TableHead>Global Default</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Override</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {features?.map((feature: any) => {
                            const state = getEffectiveState(feature)
                            return (
                                <TableRow key={feature.key}>
                                    <TableCell className="font-medium">
                                        {feature.name}
                                        <div className="text-xs text-muted-foreground">
                                            {feature.description}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={feature.default_enabled ? 'default' : 'secondary'}>
                                            {feature.default_enabled ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={state.enabled ? 'outline' : 'destructive'}>
                                                {state.enabled ? 'Active' : 'Inactive'}
                                            </Badge>
                                            {state.isOverride && (
                                                <span className="text-xs text-muted-foreground">(Overridden)</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <FeatureSwitch
                                            featureKey={feature.key}
                                            enabled={state.enabled}
                                            onToggle={async (key, enabled) => {
                                                'use server'
                                                await updateCommunityFeature(id, key, enabled)
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
