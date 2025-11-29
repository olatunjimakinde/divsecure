'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addGuard, removeGuard } from './actions'

export function AddGuardDialog({ communityId }: { communityId: string }) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Guard
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Security Guard</DialogTitle>
                    <DialogDescription>
                        Enter the email address of the user you want to add as a security guard.
                    </DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    await addGuard(formData)
                    setOpen(false)
                }}>
                    <input type="hidden" name="communityId" value={communityId} />
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="guard@example.com"
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Add Guard</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function RemoveGuardButton({ memberId, communityId }: { memberId: string, communityId: string }) {
    return (
        <ConfirmationDialog
            trigger={
                <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            }
            title="Remove Guard"
            description="Are you sure you want to remove this security guard? They will lose all access."
            actionLabel="Remove"
            variant="destructive"
            onConfirm={async () => {
                const formData = new FormData()
                formData.append('memberId', memberId)
                formData.append('communityId', communityId)
                await removeGuard(formData)
            }}
        />
    )
}
