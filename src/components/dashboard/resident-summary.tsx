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
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={`/communities/${communitySlug}/messages`}>
                <Card className="hover:bg-muted/50 transition-all hover:shadow-md cursor-pointer h-full border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Messages
                        </CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-full">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{unreadMessages || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            In your inbox
                        </p>
                    </CardContent>
                </Card>
            </Link>

            <Link href={`/communities/${communitySlug}/visitors`}>
                <Card className="hover:bg-muted/50 transition-all hover:shadow-md cursor-pointer h-full border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Codes
                        </CardTitle>
                        <div className="p-2 bg-green-500/10 rounded-full">
                            <UserPlus className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{activeCodes || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Visitors currently allowed
                        </p>
                    </CardContent>
                </Card>
            </Link>

            <Link href={`/communities/${communitySlug}/visitors`}>
                <Card className="group hover:bg-primary/5 transition-all hover:shadow-md cursor-pointer h-full border-dashed border-2 hover:border-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                            Quick Invite
                        </CardTitle>
                        <div className="p-2 bg-primary/5 group-hover:bg-primary/10 rounded-full transition-colors">
                            <History className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold text-primary/80 group-hover:text-primary transition-colors">Create New Code &rarr;</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Invite a guest instantly
                        </p>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}
