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

export async function VisitorHistoryList({
    communityId,
}: {
    communityId: string
}) {
    const supabase = await createClient()

    const { data: logs, error } = await supabase
        .from('visitor_logs')
        .select(`
            id,
            entered_at,
            exited_at,
            entry_point,
            visitor_codes!inner (
                visitor_name,
                vehicle_plate,
                access_code
            ),
            guard:profiles!guard_id (
                full_name
            )
        `)
        .eq('community_id', communityId)
        .order('entered_at', { ascending: false })

    if (error) {
        console.error('Error fetching visitor history:', error)
        return <div className="text-destructive">Failed to load history.</div>
    }

    if (!logs?.length) {
        return <div className="text-center py-12 text-muted-foreground">No entry history found.</div>
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Visitor</TableHead>
                            <TableHead>Vehicle</TableHead>
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
                                    {log.visitor_codes.vehicle_plate ? (
                                        <Badge variant="outline" className="font-mono">
                                            {log.visitor_codes.vehicle_plate}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">
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

            {/* Mobile Grid */}
            <div className="grid gap-4 md:hidden">
                {logs.map((log: any) => (
                    <div key={log.id} className="flex flex-col gap-3 rounded-lg border p-4 shadow-sm bg-card transition-colors">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="font-semibold">{log.visitor_codes.visitor_name}</div>
                                <div className="text-xs text-muted-foreground font-mono">{log.visitor_codes.access_code}</div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-medium text-sm">
                                    {new Date(log.entered_at).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(log.entered_at).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-b py-2 my-1">
                            {log.visitor_codes.vehicle_plate ? (
                                <div className="flex items-center gap-1 text-sm">
                                    <span className="text-muted-foreground">Vehicle:</span>
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {log.visitor_codes.vehicle_plate}
                                    </Badge>
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground italic">No vehicle</span>
                            )}

                            <div className="flex items-center gap-1 text-sm">
                                <span className="text-muted-foreground">By:</span>
                                <span>{log.guard?.full_name || 'System'}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status</span>
                            {log.exited_at ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Exited at {new Date(log.exited_at).toLocaleTimeString()}</span>
                                </div>
                            ) : (
                                <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-500/20">
                                    Active
                                </Badge>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
