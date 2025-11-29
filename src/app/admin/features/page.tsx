import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

import { updateFeatureDefault } from './actions'
import { FeatureSwitch } from './feature-switch'

export default async function AdminFeaturesPage() {
    const supabase = await createClient()

    const { data: features } = await supabase
        .from('features' as any)
        .select('*')
        .order('name')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Global Features</h1>
                <p className="text-muted-foreground">
                    Manage default availability of features across the platform.
                </p>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Key</TableHead>
                            <TableHead>Default Enabled</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {features?.map((feature: any) => (
                            <TableRow key={feature.key}>
                                <TableCell className="font-medium">{feature.name}</TableCell>
                                <TableCell>{feature.description}</TableCell>
                                <TableCell className="font-mono text-xs">{feature.key}</TableCell>
                                <TableCell>
                                    <FeatureSwitch
                                        featureKey={feature.key}
                                        enabled={feature.default_enabled}
                                        onToggle={updateFeatureDefault}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
