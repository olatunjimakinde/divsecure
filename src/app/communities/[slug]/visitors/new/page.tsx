import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VisitorForm } from './visitor-form'

export default async function NewVisitorPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const supabase = await createClient()
    const { slug } = await params

    const { data: community } = await supabase
        .from('communities')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!community) {
        notFound()
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: member } = await supabase
        .from('members')
        .select('status')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .single()

    if (member?.status !== 'approved') {
        // Redirect to the main visitors page which shows the pending state
        // or we could just show notFound() / error
        return (
            <div className="max-w-2xl mx-auto space-y-6 py-12 text-center">
                <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                <p className="text-muted-foreground">
                    You must be an approved resident to generate visitor codes.
                </p>
                <Button asChild variant="outline">
                    <Link href={`/communities/${slug}/visitors`}>Back to Visitors</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" asChild>
                    <Link href={`/communities/${slug}/visitors`}>&larr; Back</Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Generate Access Code</h1>
            </div>

            <VisitorForm communityId={community.id} communitySlug={slug} />
        </div>
    )
}
