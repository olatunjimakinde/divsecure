'use client'

import { useState } from 'react'
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
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { inviteResidentByHead } from '../../household/actions'

interface AddResidentDialogProps {
    communitySlug: string
}

export function AddResidentDialog({ communitySlug }: AddResidentDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            const result = await inviteResidentByHead(formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                setOpen(false)
                toast.success('Resident invited successfully', {
                    description: 'An invitation email has been sent to the resident.'
                })
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again.')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resident
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Resident</DialogTitle>
                    <DialogDescription>
                        Invite a new resident to your household by email.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <input type="hidden" name="communitySlug" value={communitySlug} />
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" name="fullName" placeholder="John Doe" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Invite'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
