import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GlassCard } from '@/components/ui/glass-card'
import { Users, Building2, Activity } from 'lucide-react'

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    // Fetch stats
    const { count: communitiesCount } = await supabase
        .from('communities')
        .select('*', { count: 'exact', head: true })

    const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    const { count: featuresCount } = await supabase
        .from('features' as any)
        .select('*', { count: 'exact', head: true })

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
                <p className="text-muted-foreground mt-1">
                    System-wide statistics and metrics.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <GlassCard className="border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Communities</CardTitle>
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Building2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{communitiesCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Registered communities</p>
                    </CardContent>
                </GlassCard>

                <GlassCard className="border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{usersCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Platform members</p>
                    </CardContent>
                </GlassCard>

                <GlassCard className="border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Global Features</CardTitle>
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Activity className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{featuresCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active features</p>
                    </CardContent>
                </GlassCard>
            </div>
        </div>
    )
}
