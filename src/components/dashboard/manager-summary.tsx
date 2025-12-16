import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Users, ShieldCheck, UserCheck } from 'lucide-react'
import Link from 'next/link'

interface ManagerSummaryProps {
    communityId: string
    communitySlug: string
}

export async function ManagerSummary({ communityId, communitySlug }: ManagerSummaryProps) {
    const supabase = await createClient()

    // 1. Unread Messages
    const { count: unreadMessages } = await supabase
        .from('security_messages')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .eq('recipient_group', 'community_manager')
        .eq('is_read', false)

    // 2. Active Guards (Shift active)
    const { count: activeGuards } = await supabase
        .from('shifts')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .eq('status', 'active')

    // 3. Total Residents
    const { count: totalResidents } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .eq('role', 'resident')
        .eq('status', 'approved')

    // 4. Pending Approvals
    const { count: pendingApprovals } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .eq('status', 'pending')

    return (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Link href={`/communities/${communitySlug}/security`}>
                <Card className="hover:bg-muted/50 transition-all hover:shadow-md cursor-pointer h-full border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Unread Messages
                        </CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-full">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{unreadMessages || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Action required
                        </p>
                    </CardContent>
                </Card>
            </Link>

            <Link href={`/communities/${communitySlug}/security`}>
                <Card className="hover:bg-muted/50 transition-all hover:shadow-md cursor-pointer h-full border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Guards
                        </CardTitle>
                        <div className="p-2 bg-green-500/10 rounded-full">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{activeGuards || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Currently on duty
                        </p>
                    </CardContent>
                </Card>
            </Link>

            <Link href={`/communities/${communitySlug}/residents`}>
                <Card className="hover:bg-muted/50 transition-all hover:shadow-md cursor-pointer h-full border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Residents
                        </CardTitle>
                        <div className="p-2 bg-purple-500/10 rounded-full">
                            <Users className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{totalResidents || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Registered members
                        </p>
                    </CardContent>
                </Card>
            </Link>

            <Link href={`/communities/${communitySlug}/residents?status=pending`}>
                <Card className="hover:bg-muted/50 transition-all hover:shadow-md cursor-pointer h-full border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pending Approvals
                        </CardTitle>
                        <div className="p-2 bg-orange-500/10 rounded-full">
                            <UserCheck className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{pendingApprovals || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Awaiting verification
                        </p>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}
