'use client'

import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { rejectResident, suspendResident, deleteResident } from './actions'
import { Trash2, Ban } from 'lucide-react'

interface ResidentButtonProps {
    memberId: string
    communityId: string
    communitySlug: string
}

export function RejectResidentButton({ memberId, communityId, communitySlug }: ResidentButtonProps) {
    return (
        <ConfirmationDialog
            trigger={<Button size="sm" variant="destructive">Reject</Button>}
            title="Reject Resident"
            description="Are you sure you want to reject this resident? They will not be able to access the community."
            actionLabel="Reject"
            variant="destructive"
            onConfirm={async () => {
                const formData = new FormData()
                formData.append('memberId', memberId)
                formData.append('communityId', communityId)
                formData.append('communitySlug', communitySlug)
                await rejectResident(formData)
            }}
        />
    )
}

export function SuspendResidentButton({ memberId, communityId, communitySlug }: ResidentButtonProps) {
    return (
        <ConfirmationDialog
            trigger={
                <Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend Resident
                </Button>
            }
            title="Suspend Resident"
            description="Are you sure you want to suspend this resident? They will temporarily lose access."
            actionLabel="Suspend"
            variant="destructive"
            onConfirm={async () => {
                const formData = new FormData()
                formData.append('memberId', memberId)
                formData.append('communityId', communityId)
                formData.append('communitySlug', communitySlug)
                await suspendResident(formData)
            }}
        />
    )
}

export function DeleteResidentButton({ memberId, communityId, communitySlug }: ResidentButtonProps) {
    return (
        <ConfirmationDialog
            trigger={
                <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Resident
                </Button>
            }
            title="Remove Resident"
            description="Are you sure you want to remove this resident? This action cannot be undone."
            actionLabel="Remove"
            variant="destructive"
            onConfirm={async () => {
                const formData = new FormData()
                formData.append('memberId', memberId)
                formData.append('communityId', communityId)
                formData.append('communitySlug', communitySlug)
                await deleteResident(formData)
            }}
        />
    )
}
