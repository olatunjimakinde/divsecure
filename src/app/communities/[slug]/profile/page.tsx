import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '../../profile/actions'
import Link from 'next/link'

export default async function ProfilePage({
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

    const [communityResult, profileResult] = await Promise.all([
        supabase
            .from('communities')
            .select('id, name')
            .eq('slug', slug)
            .single(),
        supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
    ])

    const community = communityResult.data
    const profile = profileResult.data

    if (!community) {
        notFound()
    }

    return (
        <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your personal information.
                </p>
            </div>

            <GlassCard className="border-white/20 dark:border-white/10 shadow-sm">
                <div className="p-6 border-b border-border/50 pb-6 mb-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold tracking-tight">Personal Details</h2>
                        <p className="text-sm text-muted-foreground">
                            Update your name and contact information.
                        </p>
                    </div>
                </div>
                <div className="px-6 pb-6 pt-0">
                    <form action={async (formData) => {
                        'use server'
                        await updateProfile(formData)
                    }} className="space-y-4">
                        <input type="hidden" name="communitySlug" value={slug} />

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user.email} disabled className="bg-muted/50" />
                            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                defaultValue={profile?.full_name || ''}
                                placeholder="Enter your full name"
                                className="bg-background/50"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                defaultValue={profile?.phone || ''}
                                placeholder="Enter your phone number"
                                className="bg-background/50"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" className="shadow-sm">Save Changes</Button>
                        </div>
                    </form>
                </div>
            </GlassCard>

            <GlassCard className="border-white/20 dark:border-white/10 shadow-sm">
                <div className="p-6 border-b border-border/50 pb-6 mb-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold tracking-tight">Notification Preferences</h2>
                        <p className="text-sm text-muted-foreground">
                            Manage how you receive alerts and updates.
                        </p>
                    </div>
                </div>
                <div className="px-6 pb-6 pt-0">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href={`/communities/${slug}/profile/notifications`}>
                            Manage Notifications
                        </Link>
                    </Button>
                </div>
            </GlassCard>
        </div>
    )
}
