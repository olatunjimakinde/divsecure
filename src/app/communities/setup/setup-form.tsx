'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { setupCommunity } from './actions'
import { SubmitButton } from '@/components/submit-button'

const initialState = {
    error: '',
}

export function SetupCommunityForm({ reference, planId }: { reference?: string, planId?: string }) {
    const [state, formAction] = useActionState(setupCommunity, initialState)
    const [communityName, setCommunityName] = useState('')
    const [communitySlug, setCommunitySlug] = useState('')
    const [isSlugEdited, setIsSlugEdited] = useState(false)

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value
        setCommunityName(name)
        if (!isSlugEdited) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            setCommunitySlug(slug)
        }
    }

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCommunitySlug(e.target.value)
        setIsSlugEdited(true)
    }

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="reference" value={reference || ''} />
            <input type="hidden" name="planId" value={planId || ''} />

            {state?.error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-2">
                <Label htmlFor="communityName">Community Name</Label>
                <Input
                    id="communityName"
                    name="communityName"
                    placeholder="Sunset Valley"
                    required
                    value={communityName}
                    onChange={handleNameChange}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="communitySlug">Community URL Slug</Label>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/communities/</span>
                    <Input
                        id="communitySlug"
                        name="communitySlug"
                        placeholder="sunset-valley"
                        required
                        value={communitySlug}
                        onChange={handleSlugChange}
                    />
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                    Unique URL for your community.
                </p>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="communityAddress">Community Address</Label>
                <Input id="communityAddress" name="communityAddress" placeholder="123 Main St" required />
            </div>

            <SubmitButton className="w-full" pendingText="Creating Community...">
                Complete Setup
            </SubmitButton>
        </form>
    )
}
