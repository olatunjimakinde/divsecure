'use client'

import { createChannel } from './channels/actions'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useState } from 'react'

export function CreateChannelDialog({
    communityId,
    communitySlug,
}: {
    communityId: string
    communitySlug: string
}) {
    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        const result = await createChannel(formData)
        if (result?.error) {
            setError(result.error)
        } else {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                    + Create Message Board
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Message Board</DialogTitle>
                    <DialogDescription>
                        Add a new message board to your community.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <input type="hidden" name="communityId" value={communityId} />
                    <input type="hidden" name="communitySlug" value={communitySlug} />
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" placeholder="General" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" name="slug" placeholder="general" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="audience">Audience</Label>
                        <select
                            id="audience"
                            name="audience"
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="all">All Residents</option>
                            <option value="household_heads">Household Heads Only</option>
                            <option value="security_guards">Security Guards Only</option>
                            <option value="head_of_security">Head of Security Only</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="allowReplies"
                            name="allowReplies"
                            defaultChecked
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="allowReplies">Allow Replies</Label>
                    </div>

                    {error && <div className="text-sm text-destructive">{error}</div>}
                    <DialogFooter>
                        <SubmitButton>Create Message Board</SubmitButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
