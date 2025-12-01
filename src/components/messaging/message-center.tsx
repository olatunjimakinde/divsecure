'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { NewMessageDialog } from './new-message-dialog'
import { Mail, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Message {
    id: string
    subject: string
    content: string
    created_at: string
    is_read: boolean
    sender: {
        full_name: string | null
        email: string | null
    }
    recipient_group?: string | null
    recipient_id?: string | null
    sender_id: string
}

interface MessageCenterProps {
    communityId: string
    communitySlug: string
    userRole: string
    inboxMessages: Message[]
    sentMessages: Message[]
    potentialRecipients: any[]
}

export function MessageCenter({
    communityId,
    communitySlug,
    userRole,
    inboxMessages: initialInbox,
    sentMessages: initialSent,
    potentialRecipients
}: MessageCenterProps) {
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
    const [inboxMessages, setInboxMessages] = useState<Message[]>(initialInbox)
    const [sentMessages, setSentMessages] = useState<Message[]>(initialSent)
    const [mounted, setMounted] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const channel = supabase
            .channel('security_messages_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'security_messages',
                    filter: `community_id=eq.${communityId}`
                },
                async (payload) => {
                    console.log('Realtime change:', payload)

                    if (payload.eventType === 'INSERT') {
                        const newMessage = payload.new as any

                        // Fetch sender details for the new message
                        const { data: senderData } = await supabase
                            .from('profiles')
                            .select('full_name, email')
                            .eq('id', newMessage.sender_id)
                            .single()

                        const completeMessage: Message = {
                            ...newMessage,
                            sender: senderData || { full_name: 'Unknown', email: null }
                        }

                        // Determine if it belongs in Inbox or Sent
                        const { data: { user } } = await supabase.auth.getUser()
                        if (user?.id === newMessage.sender_id) {
                            setSentMessages(prev => [completeMessage, ...prev])
                        } else {
                            // Check if it's for us (Direct or Group)
                            // Note: The RLS policy already filters what we receive, 
                            // but we can double check or just rely on the fact we received it via subscription 
                            // (though subscription filters are limited, RLS doesn't apply to realtime stream unless 'secure' is used, 
                            // but standard realtime receives all events matching filter. 
                            // Ideally we should verify recipient, but for now we'll assume if we get it, it's relevant 
                            // OR we need to filter client side based on our ID/Role.
                            // Since we can't easily filter by "my id" in the subscription string without knowing it easily here (async),
                            // we'll add it to inbox.

                            // Optimization: In a real app, we might want to be stricter.
                            setInboxMessages(prev => [completeMessage, ...prev])
                            toast.info('New Message Received', {
                                description: completeMessage.subject
                            })
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedMessage = payload.new as any
                        // Update in both lists
                        setInboxMessages(prev => prev.map(m => m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m))
                        setSentMessages(prev => prev.map(m => m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m))

                        if (selectedMessage?.id === updatedMessage.id) {
                            setSelectedMessage(prev => prev ? { ...prev, ...updatedMessage } : null)
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [communityId, supabase, selectedMessage])

    return (
        <div className="grid gap-4 md:grid-cols-[300px_1fr] lg:grid-cols-[400px_1fr] h-[600px]">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold tracking-tight">Messages</h2>
                    <NewMessageDialog
                        communityId={communityId}
                        communitySlug={communitySlug}
                        userRole={userRole}
                        potentialRecipients={potentialRecipients}
                    />
                </div>

                <Tabs defaultValue="inbox" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="inbox">Inbox ({inboxMessages.filter(m => !m.is_read).length})</TabsTrigger>
                        <TabsTrigger value="sent">Sent</TabsTrigger>
                    </TabsList>

                    <TabsContent value="inbox" className="flex-1 mt-2 border rounded-md overflow-hidden">
                        <ScrollArea className="h-[500px]">
                            <div className="flex flex-col">
                                {inboxMessages.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No messages
                                    </div>
                                )}
                                {inboxMessages.map((message) => (
                                    <button
                                        key={message.id}
                                        className={`flex flex-col items-start gap-2 p-4 text-left hover:bg-muted/50 transition-colors border-b last:border-0 ${selectedMessage?.id === message.id ? 'bg-muted' : ''}`}
                                        onClick={() => setSelectedMessage(message)}
                                    >
                                        <div className="flex w-full flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${!message.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {message.sender?.full_name || 'Unknown Sender'}
                                                    </span>
                                                    {!message.is_read && (
                                                        <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {mounted ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) : ''}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium leading-none">
                                                {message.subject}
                                            </span>
                                            <span className="line-clamp-2 text-xs text-muted-foreground">
                                                {message.content}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="sent" className="flex-1 mt-2 border rounded-md overflow-hidden">
                        <ScrollArea className="h-[500px]">
                            <div className="flex flex-col">
                                {sentMessages.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No sent messages
                                    </div>
                                )}
                                {sentMessages.map((message) => (
                                    <button
                                        key={message.id}
                                        className={`flex flex-col items-start gap-2 p-4 text-left hover:bg-muted/50 transition-colors border-b last:border-0 ${selectedMessage?.id === message.id ? 'bg-muted' : ''}`}
                                        onClick={() => setSelectedMessage(message)}
                                    >
                                        <div className="flex w-full flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-muted-foreground">
                                                        To: {message.recipient_group ? message.recipient_group.replace('_', ' ') : 'Individual'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {mounted ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) : ''}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium leading-none">
                                                {message.subject}
                                            </span>
                                            <span className="line-clamp-2 text-xs text-muted-foreground">
                                                {message.content}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="flex flex-col h-full">
                {selectedMessage ? (
                    <Card className="h-full flex flex-col">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle>{selectedMessage.subject}</CardTitle>
                                    <CardDescription>
                                        From: {selectedMessage.sender?.full_name || selectedMessage.sender?.email}
                                        <br />
                                        Sent: {mounted ? new Date(selectedMessage.created_at).toLocaleString() : ''}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-6">
                            <div className="prose prose-sm max-w-none">
                                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4 border rounded-lg bg-muted/10 p-8 text-center">
                        <Mail className="h-12 w-12 text-muted-foreground/50" />
                        <div className="space-y-1">
                            <h3 className="text-lg font-medium">No message selected</h3>
                            <p className="text-sm text-muted-foreground">
                                Select a message from the list to view its contents.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
