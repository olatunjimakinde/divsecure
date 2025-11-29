'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash, Ban, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateResident, suspendResident, deleteResident, approveResident, rejectResident } from './actions'

type Resident = {
    id: string
    unit_number: string | null
    status: 'pending' | 'approved' | 'rejected' | 'suspended'
    profiles: {
        full_name: string | null
        email: string | null
    } | null
}

export function ResidentActions({ resident, communityId, communitySlug }: { resident: Resident, communityId: string, communitySlug: string }) {
    const [isUpdateOpen, setIsUpdateOpen] = useState(false)
    const [isSuspendOpen, setIsSuspendOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [unitNumber, setUnitNumber] = useState(resident.unit_number || '')

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setIsUpdateOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Update Unit
                    </DropdownMenuItem>
                    {resident.status === 'approved' && (
                        <DropdownMenuItem onClick={() => setIsSuspendOpen(true)} className="text-destructive">
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend
                        </DropdownMenuItem>
                    )}
                    {resident.status === 'suspended' && (
                        <DropdownMenuItem asChild>
                            <form action={async (formData) => {
                                await approveResident(formData)
                            }} className="w-full cursor-pointer">
                                <input type="hidden" name="memberId" value={resident.id} />
                                <input type="hidden" name="communityId" value={communityId} />
                                <input type="hidden" name="communitySlug" value={communitySlug} />
                                <button type="submit" className="flex w-full items-center">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Re-activate
                                </button>
                            </form>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => setIsDeleteOpen(true)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Update Dialog */}
            <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Resident</DialogTitle>
                        <DialogDescription>
                            Update details for {resident.profiles?.full_name || resident.profiles?.email}
                        </DialogDescription>
                    </DialogHeader>
                    <form action={async (formData) => {
                        await updateResident(formData)
                        setIsUpdateOpen(false)
                    }}>
                        <input type="hidden" name="memberId" value={resident.id} />
                        <input type="hidden" name="communityId" value={communityId} />
                        <input type="hidden" name="communitySlug" value={communitySlug} />
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="unitNumber" className="text-right">
                                    Unit Number
                                </Label>
                                <Input
                                    id="unitNumber"
                                    name="unitNumber"
                                    value={unitNumber}
                                    onChange={(e) => setUnitNumber(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Suspend Confirmation */}
            <ConfirmationDialog
                open={isSuspendOpen}
                onOpenChange={setIsSuspendOpen}
                trigger={null}
                title="Suspend Resident"
                description="Are you sure you want to suspend this resident? They will temporarily lose access."
                actionLabel="Suspend"
                variant="destructive"
                onConfirm={async () => {
                    const formData = new FormData()
                    formData.append('memberId', resident.id)
                    formData.append('communityId', communityId)
                    formData.append('communitySlug', communitySlug)
                    await suspendResident(formData)
                }}
            />

            {/* Delete Confirmation */}
            <ConfirmationDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                trigger={null}
                title="Remove Resident"
                description="Are you sure you want to remove this resident? This action cannot be undone."
                actionLabel="Remove"
                variant="destructive"
                onConfirm={async () => {
                    const formData = new FormData()
                    formData.append('memberId', resident.id)
                    formData.append('communityId', communityId)
                    formData.append('communitySlug', communitySlug)
                    await deleteResident(formData)
                }}
            />
        </>
    )
}
