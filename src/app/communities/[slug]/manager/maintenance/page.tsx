import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { Wrench, User } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { getMaintenanceRequests } from '../../../maintenance/actions';
import { StatusUpdateSelector } from './status-update-selector';

interface ManagerMaintenancePageProps {
    params: Promise<{ slug: string }>;
}

function PriorityBadge({ priority }: { priority: string }) {
    const styles = {
        low: 'bg-slate-100 text-slate-800',
        medium: 'bg-orange-100 text-orange-800',
        high: 'bg-red-100 text-red-800',
        urgent: 'bg-red-600 text-white',
    };

    return (
        <Badge variant="outline" className={styles[priority as keyof typeof styles]}>
            {priority}
        </Badge>
    );
}

export default async function ManagerMaintenancePage({ params }: ManagerMaintenancePageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: community } = await supabase
        .from('communities')
        .select('id, name')
        .eq('slug', slug)
        .single();

    if (!community) {
        notFound();
    }

    const { data: requests } = await getMaintenanceRequests(community.id, true);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Maintenance Requests</h1>
                <p className="text-muted-foreground">Manage and track resident maintenance reports.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Requests</CardTitle>
                    <CardDescription>
                        A list of all maintenance requests submitted by residents.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!requests || requests.length === 0 ? (
                        <div className="flex h-[200px] flex-col items-center justify-center text-center text-muted-foreground">
                            <Wrench className="mb-2 h-8 w-8 opacity-20" />
                            <p>No requests found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Issue</TableHead>
                                    <TableHead>Resident</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request: any) => (
                                    <TableRow key={request.id}>
                                        <TableCell>
                                            <div className="font-medium">{request.title}</div>
                                            <div className="line-clamp-1 text-xs text-muted-foreground">
                                                {request.description}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback>
                                                        {request.reporter?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">
                                                        {request.reporter?.full_name || 'Unknown'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Unit: {request.unit_number || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <PriorityBadge priority={request.priority} />
                                        </TableCell>
                                        <TableCell>
                                            <StatusUpdateSelector
                                                requestId={request.id}
                                                communityId={community.id}
                                                communitySlug={slug}
                                                currentStatus={request.status}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {format(new Date(request.created_at), 'MMM d')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
