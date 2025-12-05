'use client'

import { createPost } from './actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useState, useRef } from 'react'

export function CreatePostForm({
    channelId,
    communitySlug,
    channelSlug,
    onOptimisticAdd
}: {
    channelId: string
    communitySlug: string
    channelSlug: string
    onOptimisticAdd?: (content: string) => void
}) {
    const [error, setError] = useState<string | null>(null)
    const formRef = useRef<HTMLFormElement>(null)

    async function handleSubmit(formData: FormData) {
        const content = formData.get('content') as string
        if (!content.trim()) return

        // Optimistic Update
        onOptimisticAdd?.(content)
        formRef.current?.reset()

        const result = await createPost(formData)
        if (result?.error) {
            setError(result.error)
            // Ideally revert optimistic update here if possible, or show error toast
        } else {
            setError(null)
        }
    }

    return (
        <form ref={formRef} action={handleSubmit} className="space-y-4">
            <input type="hidden" name="channelId" value={channelId} />
            <input type="hidden" name="communitySlug" value={communitySlug} />
            <input type="hidden" name="channelSlug" value={channelSlug} />

            <div className="space-y-2">
                <Textarea
                    name="content"
                    placeholder="Message this channel..."
                    required
                    className="min-h-[100px]"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            e.currentTarget.form?.requestSubmit()
                        }
                    }}
                />
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="flex justify-end">
                <Button type="submit">Send Message</Button>
            </div>
        </form>
    )
}
