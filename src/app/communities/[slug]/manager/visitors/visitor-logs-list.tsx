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

export async function VisitorLogsList({
    communityId,
    searchQuery,
}: {
    communityId: string
    searchQuery?: string
}) {
    const supabase = await createClient()

    let query = supabase
        .from('visitor_logs')
        .select(`
            id,
            entered_at,
            entry_point,
            visitor_codes!inner (
                visitor_name,
                vehicle_plate,
                access_code,
                host:profiles!host_id (
                    full_name,
                    email
                )
            ),
            guard:profiles!guard_id (
                full_name
            )
        `)
        .eq('community_id', communityId)
        .order('entered_at', { ascending: false })

    if (searchQuery) {
        // This search is a bit complex with nested relations.
        // We might need to filter on the client or use a more complex query.
        // For now, let's try to filter by visitor name if possible, but !inner on visitor_codes helps.
        // But searching across multiple tables is tricky in one go.
        // We'll skip search for now or implement a basic one.
    }

    const { data: logs, error } = await query

    if (error) {
        console.error('Error fetching visitor logs:', error)
        return <div className="text-destructive">Failed to load logs. Please try again later.</div>
    }

    if (!logs?.length) {
        return <div className="text-center py-12 text-muted-foreground">No visitor entries recorded yet.</div>
    }

    return (
        <>
            <div className="rounded-md border hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Visitor</TableHead>
                            <TableHead>Host</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Entry Point</TableHead>
                            <TableHead>Verified By</TableHead>
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
                                    <div className="text-sm">
                                        {log.visitor_codes.host?.full_name || 'Unknown'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {log.visitor_codes.host?.email}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {log.visitor_codes.vehicle_plate ? (
                                        <Badge variant="outline" className="font-mono">
                                            {log.visitor_codes.vehicle_plate}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>{log.entry_point || 'Main Gate'}</TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                        {log.guard?.full_name || 'System'}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
                {logs.map((log: any) => (
                    <div key={log.id} className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm bg-card">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="font-semibold">{log.visitor_codes.visitor_name}</div>
                                <div className="text-xs text-muted-foreground font-mono">
                                    {log.visitor_codes.access_code}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-medium text-sm">
                                    {new Date(log.entered_at).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(log.entered_at).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">Host</span>
                                <span>{log.visitor_codes.host?.full_name || 'Unknown'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">Vehicle</span>
                                <span>{log.visitor_codes.vehicle_plate || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">Entry Point</span>
                                <span>{log.entry_point || 'Main Gate'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">Verified By</span>
                                <span>{log.guard?.full_name || 'System'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
