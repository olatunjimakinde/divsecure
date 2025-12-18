'use client'

import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { toggleGuardStatus, deleteShift } from '@/app/communities/security/actions'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface SecurityButtonProps {
    memberId: string
    communitySlug: string
    currentStatus?: 'approved' | 'suspended' | 'pending' | 'rejected'
}

export function ToggleGuardStatusButton({ memberId, communitySlug, currentStatus }: SecurityButtonProps) {
    const isSuspending = currentStatus === 'approved'

    if (!isSuspending) {
        // If activating, maybe no confirmation needed, or a simple one?
        // User asked for "delete or suspend".
        // Let's just do a direct form submission for activation for now, 
        // OR we can use the dialog for consistency but maybe less "destructive" styling.
        // Actually, let's just stick to the requirement: "delete or suspend".
        return (
            <form action={async (formData) => {
                const result = await toggleGuardStatus(null, formData)
                if (result?.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Guard activated successfully')
                }
            }}>
                <input type="hidden" name="memberId" value={memberId} />
                <input type="hidden" name="communitySlug" value={communitySlug} />
                <input type="hidden" name="currentStatus" value={currentStatus} />
                <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600"
                >
                    Activate
                </Button>
            </form>
        )
    }

    return (
        <ConfirmationDialog
            trigger={
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                >
                    Suspend
                </Button>
            }
            title="Suspend Guard"
            description="Are you sure you want to suspend this security guard? They will temporarily lose access."
            actionLabel="Suspend"
            variant="destructive"
            onConfirm={async () => {
                const formData = new FormData()
                formData.append('memberId', memberId)
                formData.append('communitySlug', communitySlug)
                formData.append('currentStatus', currentStatus)
                const result = await toggleGuardStatus(null, formData)
                if (result?.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Guard suspended successfully')
                }
            }}
        />
    )
}

interface DeleteShiftButtonProps {
    shiftId: string
    communitySlug: string
}

export function DeleteShiftButton({ shiftId, communitySlug }: DeleteShiftButtonProps) {
    return (
        <ConfirmationDialog
            trigger={
                <Button size="icon" variant="ghost" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            }
            title="Delete Shift"
            description="Are you sure you want to delete this shift? This action cannot be undone."
            actionLabel="Delete"
            variant="destructive"
            onConfirm={async () => {
                const formData = new FormData()
                formData.append('shiftId', shiftId)
                formData.append('communitySlug', communitySlug)
                await deleteShift(formData)
            }}
        />
    )
}
