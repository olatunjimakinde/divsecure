'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2, X, Check } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { updatePost, deletePost } from './actions'

interface PostItemProps {
    post: any
    currentUserId: string | undefined
    isManager: boolean
    communitySlug: string
    channelSlug: string
    onOptimisticUpdate?: (postId: string, content: string) => void
    onOptimisticDelete?: (postId: string) => void
}

export function PostItem({
    post,
    currentUserId,
    isManager,
    communitySlug,
    channelSlug,
    onOptimisticUpdate,
    onOptimisticDelete
}: PostItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(post.content)
    const [isSaving, setIsSaving] = useState(false)

    const isAuthor = currentUserId === post.user_id
    const canManage = isAuthor || isManager

    async function handleSave() {
        if (!editContent.trim()) return
        setIsSaving(true)

        // Optimistic Update
        onOptimisticUpdate?.(post.id, editContent)
        setIsEditing(false)

        const formData = new FormData()
        formData.append('postId', post.id)
        formData.append('content', editContent)
        formData.append('communitySlug', communitySlug)
        formData.append('channelSlug', channelSlug)

        await updatePost(formData)
        setIsSaving(false)
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this message?')) return

        // Optimistic Delete
        onOptimisticDelete?.(post.id)

        const formData = new FormData()
        formData.append('postId', post.id)
        formData.append('communitySlug', communitySlug)
        formData.append('channelSlug', channelSlug)

        await deletePost(formData)
    }

    return (
        <Card className="border-none shadow-none bg-transparent group">
            <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{post.user?.full_name || 'Unknown User'}</span>
                    <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleString()}
                    </span>
                    {post.created_at !== post.updated_at && (
                        <span className="text-xs text-muted-foreground italic">(edited)</span>
                    )}
                </div>
                {canManage && !isEditing && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardHeader>
            <CardContent className="p-0">
                {isEditing ? (
                    <div className="space-y-2">
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px]"
                        />
                        <div className="flex items-center gap-2">
                            <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => {
                                setIsEditing(false)
                                setEditContent(post.content)
                            }}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap">{post.content}</p>
                )}
            </CardContent>
        </Card>
    )
}
