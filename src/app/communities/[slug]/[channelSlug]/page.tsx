import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CreatePostForm } from '../../posts/create-post-form'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EditChannelDialog } from '../../edit-channel-dialog'
import { PostItem } from '../../posts/post-item'

export default async function ChannelPage({
    params,
}: {
    params: Promise<{ slug: string; channelSlug: string }>
}) {
    const supabase = await createClient()
    const { slug, channelSlug } = await params

    const { data: community } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!community) {
        notFound()
    }

    const { data: channel } = await supabase
        .from('channels')
        .select('*')
        .eq('community_id', community.id)
        .eq('slug', channelSlug)
        .single()

    if (!channel) {
        notFound()
    }

    const { data: { user } } = await supabase.auth.getUser()

    let member = null
    if (user) {
        const { data } = await supabase
            .from('members')
            .select('role, is_household_head')
            .eq('community_id', community.id)
            .eq('user_id', user.id)
            .single()
        member = data
    }

    const channelData = channel as any
    const isManager = member?.role === 'community_manager'
    const isHead = member?.is_household_head
    const isGuard = member?.role ? ['guard', 'head_of_security'].includes(member.role) : false
    const isHeadOfSecurity = member?.role === 'head_of_security'

    // Check permissions
    if (channelData.audience !== 'all') {
        if (!user) redirect('/login')

        let hasAccess = false
        if (isManager) hasAccess = true
        else if (channelData.audience === 'household_heads' && isHead) hasAccess = true
        else if (channelData.audience === 'security_guards' && isGuard) hasAccess = true
        else if (channelData.audience === 'head_of_security' && isHeadOfSecurity) hasAccess = true

        if (!hasAccess) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <h2 className="text-2xl font-bold mb-2">Restricted Access</h2>
                    <p className="text-muted-foreground">
                        This message board is restricted to {channelData.audience.replace('_', ' ')}.
                    </p>
                </div>
            )
        }
    }

    const { data: posts } = await supabase
        .from('posts')
        .select('*, user:profiles(full_name, avatar_url)')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true })

    // Check if replies are allowed
    let canReply = channelData.allow_replies
    if (!canReply && isManager) {
        canReply = true
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        #{channel.name}
                        {channelData.audience !== 'all' && (
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                                {channelData.audience.replace(/_/g, ' ')}
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {channelData.allow_replies ? 'Replies allowed' : 'Read-only'}
                    </p>
                </div>
                {isManager && (
                    <EditChannelDialog
                        channel={channel}
                        communityId={community.id}
                        communitySlug={slug}
                    />
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-4">
                {posts?.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                        <h3 className="text-lg font-semibold">Welcome to #{channel.name}!</h3>
                        <p>This is the start of the #{channel.name} message board.</p>
                    </div>
                ) : (
                    posts?.map((post) => (
                        <PostItem
                            key={post.id}
                            post={post}
                            currentUserId={user?.id}
                            isManager={isManager}
                            communitySlug={slug}
                            channelSlug={channelSlug}
                        />
                    ))
                )}
            </div>
            <div className="p-4 border-t bg-background">
                {canReply ? (
                    <CreatePostForm
                        channelId={channel.id}
                        communitySlug={slug}
                        channelSlug={channelSlug}
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
