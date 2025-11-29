import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

    const { data: community } = await supabase
        .from('communities')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!community) {
        notFound()
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground">
                    Manage your personal information.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Details</CardTitle>
                    <CardDescription>
                        Update your name and contact information.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                        'use server'
                        await updateProfile(formData)
                    }} className="space-y-4">
                        <input type="hidden" name="communitySlug" value={slug} />

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user.email} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                defaultValue={profile?.full_name || ''}
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                defaultValue={profile?.phone || ''}
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                        Manage how you receive alerts and updates.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" asChild>
                        <Link href={`/communities/${slug}/profile/notifications`}>
                            Manage Notifications
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
