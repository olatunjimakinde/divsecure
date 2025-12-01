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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href={`/communities/${communitySlug}/security`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Unread Messages
                        </CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{unreadMessages || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            For Community Manager
                        </p>
                    </CardContent>
                </Card>
            </Link>

            <Link href={`/communities/${communitySlug}/security`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Guards
                        </CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeGuards || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Currently on duty
                        </p>
                    </CardContent>
                </Card>
            </Link>

            <Link href={`/communities/${communitySlug}/residents`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Residents
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalResidents || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Approved residents
                        </p>
                    </CardContent>
                </Card>
            </Link>

            <Link href={`/communities/${communitySlug}/residents?status=pending`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Approvals
                        </CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingApprovals || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting review
                        </p>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}
