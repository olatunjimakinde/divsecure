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
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { sendMessage } from '@/app/communities/[slug]/security/messages/actions'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Recipient {
    id: string
    name: string
    role: string
}

interface NewMessageDialogProps {
    communityId: string
    communitySlug: string
    userRole: string
    potentialRecipients: Recipient[]
}

export function NewMessageDialog({ communityId, communitySlug, userRole, potentialRecipients }: NewMessageDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [recipientType, setRecipientType] = useState<string>('group')
    const [recipientGroup, setRecipientGroup] = useState<string>('')
    const [recipientId, setRecipientId] = useState<string>('')
    const [subject, setSubject] = useState('')
    const [content, setContent] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.append('communityId', communityId)
        formData.append('communitySlug', communitySlug)
        formData.append('subject', subject)
        formData.append('content', content)
        formData.append('recipientType', recipientType)

        if (recipientType === 'group') {
            formData.append('recipientGroup', recipientGroup)
        } else {
            formData.append('recipientId', recipientId)
        }

        const result = await sendMessage(formData)

        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Message Sent', {
                description: 'Your message has been delivered.',
            })
            setOpen(false)
            // Reset form
            setSubject('')
            setContent('')
            setRecipientGroup('')
            setRecipientId('')
        }
    }

    // Determine allowed groups based on role
    const allowedGroups = []
    if (userRole === 'guard') {
        allowedGroups.push({ value: 'community_manager', label: 'Community Manager' })
        allowedGroups.push({ value: 'head_of_security', label: 'Head of Security' })
    } else if (userRole === 'head_of_security') {
        allowedGroups.push({ value: 'all_guards', label: 'All Guards' })
        allowedGroups.push({ value: 'community_manager', label: 'Community Manager' })
    } else if (userRole === 'community_manager') {
        allowedGroups.push({ value: 'all_guards', label: 'All Guards' })
        allowedGroups.push({ value: 'head_of_security', label: 'Head of Security' })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Message
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>New Message</DialogTitle>
                        <DialogDescription>
                            Send a message to security staff or management.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>To</Label>
                            <Select
                                value={recipientType}
                                onValueChange={(val) => {
                                    setRecipientType(val)
                                    setRecipientGroup('')
                                    setRecipientId('')
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="group">Group</SelectItem>
                                    {(userRole === 'head_of_security' || userRole === 'community_manager') && (
                                        <SelectItem value="individual">Individual</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {recipientType === 'group' ? (
                            <div className="grid gap-2">
                                <Label>Recipient Group</Label>
                                <Select value={recipientGroup} onValueChange={setRecipientGroup} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allowedGroups.map((g) => (
                                            <SelectItem key={g.value} value={g.value}>
                                                {g.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label>Recipient</Label>
                                <Select value={recipientId} onValueChange={setRecipientId} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Person" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {potentialRecipients.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.name} ({r.role})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Enter subject"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="content">Message</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Type your message here..."
                                required
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Message
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
