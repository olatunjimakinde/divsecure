'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { UserPlus, Loader2, AlertCircle } from 'lucide-react'
import { createGuard } from '../../../security/actions'

interface CreateGuardDialogProps {
    communityId: string
    communitySlug: string
}

export function CreateGuardDialog({ communityId, communitySlug }: CreateGuardDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)

        try {
            const result = await createGuard(null, formData)
            if (result?.error) {
                setError(result.error)
            } else {
                setOpen(false)
            }
        } catch (error) {
            setError("An unexpected error occurred.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Guard
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Security Guard</DialogTitle>
                    <DialogDescription>
                        Create a new login for a security guard.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="communityId" value={communityId} />
                    <input type="hidden" name="communitySlug" value={communitySlug} />
                    <div className="grid gap-4 py-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" name="fullName" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required minLength={6} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="isHead" name="isHead" />
                            <Label htmlFor="isHead">Head of Security</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
