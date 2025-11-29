'use client'

import { Button } from '@/components/ui/button'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { updateGuard } from '../../../security/actions'

interface EditGuardDialogProps {
    guard: {
        id: string
        role: string
        profiles: {
            full_name: string | null
        } | null
    }
    communitySlug: string
}

export function EditGuardDialog({ guard, communitySlug }: EditGuardDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" title="Edit Guard">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Guard</DialogTitle>
                    <DialogDescription>
                        Update guard details and role.
                    </DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    await updateGuard(formData)
                    setOpen(false)
                }}>
                    <input type="hidden" name="memberId" value={guard.id} />
                    <input type="hidden" name="communitySlug" value={communitySlug} />
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                defaultValue={guard.profiles?.full_name || ''}
                                required
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isHead"
                                name="isHead"
                                defaultChecked={guard.role === 'head_of_security'}
                            />
                            <Label htmlFor="isHead">Head of Security</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
