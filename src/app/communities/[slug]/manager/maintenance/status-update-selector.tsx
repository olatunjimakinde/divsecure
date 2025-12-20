'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { updateMaintenanceStatus, MaintenanceStatus } from '../../../maintenance/actions';

interface StatusUpdateSelectorProps {
    requestId: string;
    communityId: string;
    communitySlug: string;
    currentStatus: MaintenanceStatus;
}

export function StatusUpdateSelector({
    requestId,
    communityId,
    communitySlug,
    currentStatus,
}: StatusUpdateSelectorProps) {
    const [status, setStatus] = useState<MaintenanceStatus>(currentStatus);
    const [isLoading, setIsLoading] = useState(false);



    const handleStatusChange = async (newStatus: MaintenanceStatus) => {
        setStatus(newStatus);
        setIsLoading(true);

        try {
            const result = await updateMaintenanceStatus(requestId, communitySlug, newStatus);
            if (result.error) {
                toast.error('Failed to update status');
                // Revert on error
                setStatus(currentStatus);
            } else {
                toast.success('Status updated');
            }
        } catch (error) {
            toast.error('Something went wrong');
            setStatus(currentStatus);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'pending':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'in_progress':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'completed':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'cancelled':
                return 'text-gray-600 bg-gray-50 border-gray-200';
            default:
                return '';
        }
    };

    return (
        <Select
            value={status}
            onValueChange={(val) => handleStatusChange(val as MaintenanceStatus)}
            disabled={isLoading}
        >
            <SelectTrigger className={`h-8 w-[130px] border ${getStatusColor(status)}`}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
        </Select>
    );
}
