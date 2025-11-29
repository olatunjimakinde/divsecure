import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export async function HouseholdActivityLog({
    communityId,
    householdId
}: {
    communityId: string
    householdId: string
}) {
    const supabase = await createClient()

    // We rely on RLS to filter logs relevant to this household (once updated).
    // But we can also filter explicitly to be safe/clear.
    // Actually, filtering by household_id on visitor_logs isn't possible directly as it's not on the table.
    // It's on visitor_codes -> host_id -> members -> household_id.
    // So we'll rely on RLS or we'd have to do a complex join.
    // Let's assume RLS will handle the security, and we just fetch logs for this community.
    // BUT, if we just fetch for community, we might get too many if RLS is open (it's not).
    // If RLS is restricted to "my codes" (current state), the Head will only see their own logs.
    // Once we update RLS, they will see all household logs.

    const { data: logs, error } = await supabase
        .from('visitor_logs' as any)
        .select(`
            id,
            entered_at,
            entry_point,
            visitor_codes!inner (
                visitor_name,
                vehicle_plate,
                access_code,
                host_id
            )
        `)
        .eq('community_id', communityId)
        .order('entered_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error('Error fetching household activity:', error)
        return <div className="text-destructive">Failed to load activity log.</div>
    }

    if (!logs?.length) {
        return <div className="text-center py-8 text-muted-foreground">No recent activity.</div>
    }

    // Fetch host names manually to avoid complex deep joins if not set up
    const hostIds = Array.from(new Set(logs.map((l: any) => l.visitor_codes.host_id)))
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', hostIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || [])

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Visitor</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Entry Point</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log: any) => (
                        <TableRow key={log.id}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">
                                        {new Date(log.entered_at).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(log.entered_at).toLocaleTimeString()}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">{log.visitor_codes.visitor_name}</div>
                                <div className="text-xs text-muted-foreground font-mono">
                                    {log.visitor_codes.access_code}
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm">
                                    {profileMap.get(log.visitor_codes.host_id) || 'Unknown'}
                                </span>
                            </TableCell>
                            <TableCell>{log.entry_point || 'Main Gate'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
