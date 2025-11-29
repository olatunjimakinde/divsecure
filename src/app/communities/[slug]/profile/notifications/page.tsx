import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

import { updateNotificationPreference } from './actions'
import { NotificationSwitch } from './notification-switch'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NotificationSettingsPage({
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

    // Fetch existing preferences
    const { data: preferences } = await supabase
        .from('notification_preferences' as any)
        .select('type, enabled')
        .eq('user_id', user.id)
        .eq('community_id', community.id)

    const isEnabled = (type: string) => {
        const pref = (preferences as any[])?.find((p: any) => p.type === type)
        return pref ? pref.enabled : true
    }

    const notificationTypes = [
        {
            id: 'visitor_arrival',
            label: 'Visitor Arrivals',
            description: 'Get notified when your visitors arrive at the gate.'
        },
        {
            id: 'announcement',
            label: 'Announcements',
            description: 'Receive updates and announcements from community managers.'
        },
        {
            id: 'security_alert',
            label: 'Security Alerts',
            description: 'Important security alerts and emergency notifications.'
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/communities/${slug}/profile`}>
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
                    <p className="text-muted-foreground">
                        Manage how you receive alerts and updates.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Email & In-App Notifications</CardTitle>
                    <CardDescription>
                        Choose which activities you want to be notified about.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {notificationTypes.map((type) => {
                        const enabled = isEnabled(type.id)
                        return (
                            <div key={type.id} className="flex items-center justify-between space-x-2">
                                <div className="space-y-0.5">
                                    <Label htmlFor={type.id} className="text-base">
                                        {type.label}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {type.description}
                                    </p>
                                </div>
                                <NotificationSwitch
                                    id={type.id}
                                    communityId={community.id}
                                    typeId={type.id}
                                    enabled={enabled}
                                />
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}
