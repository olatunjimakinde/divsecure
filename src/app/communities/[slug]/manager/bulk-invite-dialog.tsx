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
import { Upload } from 'lucide-react'
import { bulkInviteResidents } from '@/app/communities/people/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface BulkInviteDialogProps {
    communityId: string
    communitySlug: string
}

export function BulkInviteDialog({ communityId, communitySlug }: BulkInviteDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        const formData = new FormData(event.currentTarget)
        formData.append('communityId', communityId)
        formData.append('communitySlug', communitySlug) // Ensure slug is passed for revalidation

        try {
            const result = await bulkInviteResidents(formData)
            if ('error' in result) {
                toast.error(result.error)
            } else {
                toast.success(`Processed ${result.count} invites successfully`)
                if (result.errors && result.errors.length > 0) {
                    toast.warning(`Some rows failed: ${result.errors.length} errors`)
                    console.warn('Bulk invite partial failures:', result.errors)
                }
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
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Invite
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Bulk Invite Residents</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to invite multiple residents at once.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground mb-4">
                            <p className="font-semibold mb-2">CSV Format:</p>
                            <p>Columns: <code>full_name</code>, <code>email</code>, <code>household_name</code></p>
                            <p className="mt-2 text-xs">Example:</p>
                            <code className="block bg-black/5 p-2 rounded mt-1">
                                full_name,email,household_name<br />
                                John Doe,john@example.com,Unit 101<br />
                                Jane Smith,jane@example.com,Block A - 202
                            </code>
                            <p className="mt-2 text-xs text-amber-600">
                                * Household Name must match an existing household exactly.
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="file">CSV File</Label>
                            <Input
                                id="file"
                                name="file"
                                type="file"
                                accept=".csv"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Uploading...' : 'Upload & Invite'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
