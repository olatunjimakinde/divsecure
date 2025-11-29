import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export default async function CommunityPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const supabase = await createClient()
    const { slug } = await params

    const { data: community } = await supabase
        .from('communities')
        .select('id, name, description')
        .eq('slug', slug)
        .single()

    if (!community) {
        notFound()
    }

    const { data: channel } = await supabase
        .from('channels')
        .select('slug')
        .eq('community_id', community.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

    if (channel) {
        redirect(`/communities/${slug}/${channel.slug}`)
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to {community.name}</h1>
                <p className="text-muted-foreground">
                    {community.description}
                </p>
            </div>

            <div className="rounded-lg border border-dashed p-8 text-center">
                <h3 className="text-lg font-medium">No channels yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Create a channel to start the conversation.
                </p>
            </div>
        </div>
    )
}
