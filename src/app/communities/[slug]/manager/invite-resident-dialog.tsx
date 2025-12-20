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

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)
        formData.append('communityId', communityId)
        formData.append('communitySlug', communitySlug)
        // householdId is present in form if selected (Select name="householdId")

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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Resident
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Resident</DialogTitle>
                    <DialogDescription>
                        Send an invitation to a new resident. They will receive an email to set their password.
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
                                Household (Optional)
                            </Label>
                            <Select name="householdId">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a household..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {households.map((h) => (
                                        <SelectItem key={h.id} value={h.id}>
                                            {h.name}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="none">None (Unassigned)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">
                                Assigning to a household will automatically group them.
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="unitNumber">Unit Number</Label>
                            <Input
                                id="unitNumber"
                                name="unitNumber"
                                placeholder="101"
                                required
                            />
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
