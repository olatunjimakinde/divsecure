'use client'

import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { Trash2 } from 'lucide-react'
import { deleteGuard } from '../../../security/actions'
import { toast } from 'sonner'

interface DeleteGuardButtonProps {
    memberId: string
    communitySlug: string
}

export function DeleteGuardButton({ memberId, communitySlug }: DeleteGuardButtonProps) {
    return (
        <ConfirmationDialog
            trigger={
                <Button size="sm" variant="ghost" className="text-destructive" title="Delete Guard">
                    <Trash2 className="h-4 w-4" />
                </Button>
            }
            title="Delete Guard"
            description="Are you sure you want to delete this guard? This action cannot be undone and will remove their access immediately."
            actionLabel="Delete"
            variant="destructive"
            onConfirm={async () => {
                const formData = new FormData()
                formData.append('memberId', memberId)
                formData.append('communitySlug', communitySlug)
                const result = await deleteGuard(null, formData)
                if (result?.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Guard deleted successfully')
                }
            }}
        />
    )
}
