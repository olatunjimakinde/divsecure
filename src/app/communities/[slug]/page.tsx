import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { MessageSquareDashed } from 'lucide-react'

export default async function CommunityPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const supabase = await createClient()
    const { slug } = await params

    const { data: community } = await supabase
        .from('communities')
        .select(`
            id, 
            name, 
            description,
            channels (
                slug
            )
        `)
        .eq('slug', slug)
        .single()

    if (!community) {
        notFound()
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data: member } = await supabase
            .from('members')
            .select('role')
            .eq('community_id', community.id)
            .eq('user_id', user.id)
            .single()

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', user.id)
            .single()

        const isSuperAdmin = !!profile?.is_super_admin
        const isManager = member?.role === 'community_manager' || isSuperAdmin
        const isGuard = member?.role ? ['guard', 'head_of_security'].includes(member.role) : false
        const isResident = member?.role === 'resident'

        if (isManager) {
            redirect(`/communities/${slug}/manager`)
        } else if (isGuard) {
            redirect(`/communities/${slug}/security`)
        } else if (isResident) {
            redirect(`/communities/${slug}/visitors`)
        }
    }

    // Sort channels in JS since we can't easily order nested relation in single query without complex syntax
    // or we can trust the default order if it was inserted sequentially, but better to be safe.
    // Actually, for a redirect, any channel is fine, but usually the first one.
    const channels = community.channels as any[] || []
    const firstChannel = channels.sort((a, b) => a.slug.localeCompare(b.slug))[0]

    if (firstChannel) {
        redirect(`/communities/${slug}/${firstChannel.slug}`)
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to {community.name}</h1>
                <p className="text-muted-foreground">
                    {community.description}
                </p>
            </div>

            <div className="rounded-xl border border-dashed border-2 bg-muted/10 p-12 text-center animate-in zoom-in-95 duration-500 hover:bg-muted/20 transition-colors">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 ring-1 ring-primary/20">
                    <MessageSquareDashed className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">No channels yet</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                    Start the conversation by creating the first channel for this community.
                </p>
            </div>
        </div>
    )
}
