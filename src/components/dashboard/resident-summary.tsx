import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, UserPlus, History } from 'lucide-react'
import Link from 'next/link'

interface ResidentSummaryProps {
    communityId: string
    communitySlug: string
    userId: string
}

export async function ResidentSummary({ communityId, communitySlug, userId }: ResidentSummaryProps) {
    const supabase = await createClient()

    // 1. Unread Messages (Direct or All Residents)
    const { count: unreadMessages } = await supabase
        .from('security_messages')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .or(`recipient_id.eq.${userId},recipient_group.eq.all_residents`)
        .eq('is_read', false)

    // 2. Active Visitor Codes
    const { count: activeCodes } = await supabase
        .from('visitor_codes')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .eq('host_id', userId)
        .eq('is_active', true)
        .gt('valid_until', new Date().toISOString())

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href={`/communities/${communitySlug}/messages`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Messages
                        </CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{unreadMessages || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Unread notifications
                        </p>
                    </CardContent>
                </Card>
            </Link>

            <Link href={`/communities/${communitySlug}/visitors`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Codes
                        </CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCodes || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Valid visitor codes
                        </p>
                    </CardContent>
                </Card>
            </Link>

            <Link href={`/communities/${communitySlug}/visitors`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Quick Invite
                        </CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium text-primary">Create New Code &rarr;</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Invite a guest
                        </p>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}
