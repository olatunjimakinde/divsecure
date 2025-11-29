'use client'

import { createCommunity } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useState } from 'react'

export function CreateCommunityForm() {
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        const result = await createCommunity(formData)
        if (result?.error) {
            setError(result.error)
        }
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" placeholder="My Awesome Community" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL)</Label>
                        <Input id="slug" name="slug" placeholder="my-awesome-community" required />
                        <p className="text-xs text-muted-foreground">
                            This will be used in your community URL.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" name="address" placeholder="123 Community Lane" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="What is this community about?" />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full">
                        Create Community
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
