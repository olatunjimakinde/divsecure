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
            exited_at,
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
        // ... (search logic skipped as per original)
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
                            <TableHead>Vehicle/Entry</TableHead>
                            <TableHead>Verified By</TableHead>
                            <TableHead>Status / Exit</TableHead>
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
                                    <div className="flex flex-col gap-1">
                                        {log.visitor_codes.vehicle_plate ? (
                                            <Badge variant="outline" className="font-mono w-max">
                                                {log.visitor_codes.vehicle_plate}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                        <span className="text-xs text-muted-foreground">{log.entry_point || 'Main Gate'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                        {log.guard?.full_name || 'System'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {log.exited_at ? (
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">Exited</span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(log.exited_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    ) : (
                                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-500/20">
                                            Active
                                        </Badge>
                                    )}
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
                        <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                                <div className="font-semibold truncate">{log.visitor_codes.visitor_name}</div>
                                <div className="text-xs text-muted-foreground font-mono truncate">
                                    {log.visitor_codes.access_code}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                {log.exited_at ? (
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-medium text-muted-foreground">Exited</span>
                                        <span className="text-sm font-medium">
                                            {new Date(log.exited_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ) : (
                                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-500/20">
                                        Active
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">Host</span>
                                <span className="truncate">{log.visitor_codes.host?.full_name || 'Unknown'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">Verified By</span>
                                <span className="truncate">{log.guard?.full_name || 'System'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">Vehicle / Gate</span>
                                <span className="truncate">
                                    {log.visitor_codes.vehicle_plate || '-'} <span className="text-muted-foreground mx-1">•</span> {log.entry_point || 'Main'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">Entry Time</span>
                                <span className="truncate">
                                    {new Date(log.entered_at).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
