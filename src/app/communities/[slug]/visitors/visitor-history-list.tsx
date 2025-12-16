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
            entry_point,
            visitor_codes!inner (
                visitor_name,
                vehicle_plate,
                access_code
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
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Visitor</TableHead>
                        <TableHead>Vehicle</TableHead>
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
                                {log.visitor_codes.vehicle_plate ? (
                                    <Badge variant="outline" className="font-mono">
                                        {log.visitor_codes.vehicle_plate}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </TableCell>
                            <TableCell>{log.entry_point || 'Main Gate'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
