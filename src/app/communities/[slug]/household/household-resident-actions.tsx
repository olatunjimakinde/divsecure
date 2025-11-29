'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { Ban, CheckCircle, X } from 'lucide-react'
import { suspendResidentByHead, reactivateResidentByHead, removeResidentByHead } from '../../household/actions'

interface HouseholdResidentActionsProps {
    memberId: string
    communitySlug: string
    status: 'approved' | 'suspended' | 'pending' | 'rejected'
}

export function HouseholdResidentActions({ memberId, communitySlug, status }: HouseholdResidentActionsProps) {
    const [isSuspendOpen, setIsSuspendOpen] = useState(false)
    const [isRemoveOpen, setIsRemoveOpen] = useState(false)

    return (
        <div className="flex justify-end gap-2">
            {/* Suspend / Reactivate Button */}
            {status === 'approved' ? (
                <ConfirmationDialog
                    open={isSuspendOpen}
                    onOpenChange={setIsSuspendOpen}
                    trigger={
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-orange-500 hover:text-orange-600"
                            title="Suspend"
                        >
                            <Ban className="h-4 w-4" />
                            <span className="sr-only">Suspend</span>
                        </Button>
                    }
                    title="Suspend Resident"
                    description="Are you sure you want to suspend this resident? They will temporarily lose access."
                    actionLabel="Suspend"
                    variant="destructive"
                    onConfirm={async () => {
                        const formData = new FormData()
                        formData.append('memberId', memberId)
                        formData.append('communitySlug', communitySlug)
                        await suspendResidentByHead(formData)
                    }}
                />
            ) : status === 'suspended' ? (
                <form action={async (formData) => {
                    await reactivateResidentByHead(formData)
                }}>
                    <input type="hidden" name="memberId" value={memberId} />
                    <input type="hidden" name="communitySlug" value={communitySlug} />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-500 hover:text-green-600"
                        type="submit"
                        title="Reactivate"
                    >
                        <CheckCircle className="h-4 w-4" />
                        <span className="sr-only">Reactivate</span>
                    </Button>
                </form>
            ) : null}

            {/* Remove Button */}
            <ConfirmationDialog
                open={isRemoveOpen}
                onOpenChange={setIsRemoveOpen}
                trigger={
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        title="Remove"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                    </Button>
                }
                title="Remove Resident"
                description="Are you sure you want to remove this resident? This action cannot be undone."
                actionLabel="Remove"
                variant="destructive"
                onConfirm={async () => {
                    const formData = new FormData()
                    formData.append('memberId', memberId)
                    formData.append('communitySlug', communitySlug)
                    await removeResidentByHead(formData)
                }}
            />
        </div>
    )
}
