'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { sendMessageToManager } from '../../security/message-actions'
import { Loader2, Send } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function MessageManagerForm({ slug }: { slug: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const result = await sendMessageToManager(formData)
            if (result?.error) {
                setError(result.error)
            } else {
                setSuccess(true)
                // Reset form
                const form = document.getElementById('message-form') as HTMLFormElement
                form?.reset()
            }
        } catch (e) {
            setError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Message Manager</CardTitle>
                <CardDescription>
                    Send a report or urgent message to the community manager.
                </CardDescription>
            </CardHeader>
            <form id="message-form" action={handleSubmit}>
                <input type="hidden" name="communitySlug" value={slug} />
                <CardContent className="space-y-4">
                    {success && (
                        <Alert className="bg-green-50 text-green-900 border-green-200">
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>Message sent successfully.</AlertDescription>
                        </Alert>
                    )}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" name="subject" placeholder="e.g. Suspicious Activity" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">Message</Label>
                        <Textarea
                            id="content"
                            name="content"
                            placeholder="Describe the issue..."
                            required
                            className="min-h-[100px]"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Send Message
                            </>
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
