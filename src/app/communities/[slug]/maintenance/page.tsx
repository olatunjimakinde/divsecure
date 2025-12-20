import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { format } from 'date-fns';
import { Wrench, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { getMaintenanceRequests } from '../../maintenance/actions';
import { CreateRequestDialog } from './create-request-dialog';

interface MaintenancePageProps {
    params: Promise<{ slug: string }>;
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: 'bg-yellow-100 text-yellow-800',
        in_progress: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-gray-100 text-gray-800',
    };

    const icons = {
        pending: Clock,
        in_progress: Wrench,
        completed: CheckCircle2,
        cancelled: AlertCircle,
    };

    const Icon = icons[status as keyof typeof icons] || AlertCircle;

    return (
        <Badge variant="secondary" className={styles[status as keyof typeof styles]}>
            <Icon className="mr-1 h-3 w-3" />
            {status.replace('_', ' ')}
        </Badge>
    );
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

export default async function MaintenancePage({ params }: MaintenancePageProps) {
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

    const { data: requests, error } = await getMaintenanceRequests(community.id, false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Maintenance Requests</h1>
                    <p className="text-muted-foreground">
                        Track and report maintenance issues in your unit.
                    </p>
                </div>
                <CreateRequestDialog communityId={community.id} />
            </div>

            <div className="grid gap-4">
                {requests && requests.length > 0 ? (
                    requests.map((request: any) => (
                        <Card key={request.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-semibold">
                                            {request.title}
                                        </CardTitle>
                                        <CardDescription>
                                            Reported on {format(new Date(request.created_at), 'MMM d, yyyy')}
                                            {request.unit_number && ` • Unit ${request.unit_number}`}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <PriorityBadge priority={request.priority} />
                                        <StatusBadge status={request.status} />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">{request.description}</p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="flex h-[300px] flex-col items-center justify-center text-center">
                        <div className="rounded-full bg-slate-100 p-3">
                            <Wrench className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold">No maintenance requests</h3>
                            <p className="text-muted-foreground">
                                You haven't submitted any maintenance requests yet.
                            </p>
                        </div>
                        <div className="mt-4">
                            <CreateRequestDialog communityId={community.id} />
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
