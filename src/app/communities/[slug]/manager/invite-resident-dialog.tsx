'use client'

import { BulkInviteDialog } from './bulk-invite-dialog'

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
import { inviteResident } from '@/app/communities/people/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface InviteResidentDialogProps {
    communityId: string
    communitySlug: string
    households: { id: string; name: string }[]
}

export function InviteResidentDialog({ communityId, communitySlug, households }: InviteResidentDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const hasHouseholds = households.length > 0

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)
        formData.append('communityId', communityId)
        formData.append('communitySlug', communitySlug)

        // Validation: Check if household is selected
        const householdId = formData.get('householdId')
        if (!householdId || householdId === 'none') {
            toast.error('Please select a household.')
            setIsLoading(false)
            return
        }

        try {
            const result = await inviteResident(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Invitation sent successfully')
                setOpen(false)
                router.refresh()
            }
        } catch (error) {
            toast.error('Something went wrong')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!hasHouseholds) {
        return (
            <div className="flex gap-2">
                <BulkInviteDialog communityId={communityId} communitySlug={communitySlug} />
                <Button disabled title="Create a household first" variant="outline" className="opacity-50">
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Resident
                </Button>
            </div>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div className="flex gap-2 items-center">
                <BulkInviteDialog communityId={communityId} communitySlug={communitySlug} />
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Invite Resident
                    </Button>
                </DialogTrigger>
            </div>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Resident</DialogTitle>
                    <DialogDescription>
                        Send an invitation to a new resident. They must be assigned to an existing household.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="john@example.com"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="householdId">
                                Household
                            </Label>
                            <Select name="householdId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a household..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {households.map((h) => (
                                        <SelectItem key={h.id} value={h.id}>
                                            {h.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">
                                The resident will be added to this unit.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Invitation'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
