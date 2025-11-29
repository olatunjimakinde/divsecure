import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ManageSubscriptionDialog } from './manage-subscription-dialog'
import { EditPlanDialog } from './edit-plan-dialog'

export default async function AdminSubscriptionsPage() {
    const supabase = await createClient()

    // Fetch Plans
    const { data: plans } = await supabase
        .from('subscription_plans' as any)
        .select('*')
        .order('price')

    // Fetch Communities with their subscription status
    const { data: communities } = await supabase
        .from('communities')
        .select(`
            id,
            name,
            subscription:community_subscription_settings(
                status,
                plan:subscription_plans(name)
            )
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
            </div>

            {/* Plans Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                {plans?.map((plan: any) => (
                    <Card key={plan.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{plan.name}</CardTitle>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">₦{plan.price.toLocaleString()}</span>
                                <EditPlanDialog plan={plan} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground">
                                {Object.keys(plan.features || {}).length} features configured
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Community Subscriptions */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Community Subscriptions</h2>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Community</TableHead>
                                <TableHead>Current Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {communities?.map((community: any) => {
                                const sub = community.subscription?.[0]
                                return (
                                    <TableRow key={community.id}>
                                        <TableCell className="font-medium">{community.name}</TableCell>
                                        <TableCell>{sub?.plan?.name || 'Free (Default)'}</TableCell>
                                        <TableCell>
                                            <Badge variant={sub?.status === 'active' ? 'default' : 'secondary'}>
                                                {sub?.status || 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ManageSubscriptionDialog
                                                communityId={community.id}
                                                communityName={community.name}
                                                currentPlanId={sub?.plan?.id}
                                                currentStatus={sub?.status}
                                                plans={plans || []}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
