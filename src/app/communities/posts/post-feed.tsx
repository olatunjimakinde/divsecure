'use client'

import { useState, useOptimistic, useRef, useEffect } from 'react'
import { PostItem } from './post-item'
import { CreatePostForm } from './create-post-form'
import { createClient } from '@/lib/supabase/client'

interface Post {
    id: string
    content: string
    created_at: string
    updated_at?: string
    user_id: string
    channel_id: string
    user: {
        full_name: string | null
        avatar_url: string | null
    } | null
}

interface PostFeedProps {
    initialPosts: Post[]
    currentUserId: string | undefined
    currentUserProfile: { full_name: string | null; avatar_url: string | null } | null
    isManager: boolean
    communitySlug: string
    channelSlug: string
    channelId: string
    canReply: boolean
}

export function PostFeed({
    initialPosts,
    currentUserId,
    currentUserProfile,
    isManager,
    communitySlug,
    channelSlug,
    channelId,
    canReply
}: PostFeedProps) {
    const [posts, setPosts] = useState(initialPosts)
    const bottomRef = useRef<HTMLDivElement>(null)

    // Sync with server updates (revalidation)
    useEffect(() => {
        setPosts(initialPosts)
    }, [initialPosts])

    const [optimisticPosts, addOptimisticPost] = useOptimistic(
        posts,
        (state, action: { type: 'add' | 'update' | 'delete'; post?: Post; postId?: string; content?: string }) => {
            switch (action.type) {
                case 'add':
                    return [...state, action.post!]
                case 'update':
                    return state.map(p => p.id === action.postId ? { ...p, content: action.content!, updated_at: new Date().toISOString() } : p)
                case 'delete':
                    return state.filter(p => p.id !== action.postId)
                default:
                    return state
            }
        }
    )

    const handleOptimisticAdd = (content: string) => {
        const newPost: Post = {
            id: crypto.randomUUID(),
            content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: currentUserId || '',
            channel_id: channelId,
            user: currentUserProfile || { full_name: 'You', avatar_url: null }
        }
        addOptimisticPost({ type: 'add', post: newPost })

        // Scroll to bottom
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 10)
    }

    const handleOptimisticUpdate = (postId: string, content: string) => {
        addOptimisticPost({ type: 'update', postId, content })
    }

    const handleOptimisticDelete = (postId: string) => {
        addOptimisticPost({ type: 'delete', postId })
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 p-4">
                {optimisticPosts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                        <h3 className="text-lg font-semibold">No messages yet</h3>
                        <p>Be the first to say hello!</p>
                    </div>
                ) : (
                    optimisticPosts.map((post) => (
                        <PostItem
                            key={post.id}
                            post={post}
                            currentUserId={currentUserId}
                            isManager={isManager}
                            communitySlug={communitySlug}
                            channelSlug={channelSlug}
                            onOptimisticUpdate={handleOptimisticUpdate}
                            onOptimisticDelete={handleOptimisticDelete}
                        />
                    ))
                )}
                <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t bg-background">
                {canReply ? (
                    <CreatePostForm
                        channelId={channelId}
                        communitySlug={communitySlug}
                        channelSlug={channelSlug}
                        onOptimisticAdd={handleOptimisticAdd}
                    />
                ) : (
                    <div className="text-center text-muted-foreground text-sm italic">
                        This board is read-only.
                    </div>
                )}
            </div>
        </div>
    )
}
