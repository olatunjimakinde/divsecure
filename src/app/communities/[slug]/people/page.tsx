import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ResidentList } from './resident-list'
import { InviteResidentDialog } from './invite-resident-dialog'

export default async function PeoplePage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const supabase = await createClient()
    const { slug } = await params

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get Community
    const { data: community } = await supabase
        .from('communities')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!community) {
        redirect('/dashboard')
    }

    // Verify manager role or super admin
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
    const isManager = member?.role === 'community_manager'

    if (!isManager && !isSuperAdmin) {
        redirect(`/communities/${slug}`)
    }

    // Get Residents
    const { data: residents } = await supabase
        .from('members')
        .select(`
            id,
            role,
            status,
            unit_number,
            user_id,
            profiles (
                full_name,
                email,
                avatar_url
            )
        `)
        .eq('community_id', community.id)
        .eq('role', 'resident')
        .order('created_at', { ascending: false })

    // Cast the data to the expected type for the client component
    // Supabase types can be tricky with deep joins, so manual casting might be needed if TS complains
    // But let's assume standard inference works or we can define a type.
    // The component expects a specific shape.

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">People</h1>
                    <p className="text-muted-foreground">
                        Manage residents and directory.
                    </p>
                </div>
                <InviteResidentDialog communityId={community.id} communitySlug={slug} />
            </div>

            <ResidentList
                residents={residents as any[]}
                communitySlug={slug}
            />
        </div>
    )
}
