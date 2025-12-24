import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CreateChannelDialog } from '../create-channel-dialog'
import { NotificationsPopover } from '@/components/notifications-popover'
import { SignOutButton } from '@/components/sign-out-button'
import { MobileCommunityNav } from '@/components/mobile-community-nav'
import { MobileSidebar } from '@/components/mobile-sidebar'
import { Building2, Home, Users, User, MessageSquare } from 'lucide-react'
import { SubscriptionEnforcer } from '@/components/subscription-enforcer'
import { CommunitySidebarChannels } from '@/components/community-sidebar-channels'

export default async function CommunityLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ slug: string }>
}) {
    const supabase = await createClient()
    const { slug } = await params

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 1. Fetch Community
    const { data: community } = await supabase
        .from('communities')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!community) {
        notFound()
    }

    // 2. Parallel Fetch: Channels, Member (if user), Notifications (if user), Subscription, Profile (for super admin check)
    const [channelsResult, memberResult, notificationsResult, subscriptionResult, profileResult] = await Promise.all([
        supabase
            .from('channels')
            .select('*')
            .eq('community_id', community.id)
            .order('created_at', { ascending: true }),

        user ? supabase
            .from('members')
            .select('role, is_household_head, status')
            .eq('community_id', community.id)
            .eq('user_id', user.id)
            .single() : Promise.resolve({ data: null }),

        user ? supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10) : Promise.resolve({ data: [] }),

        supabase
            .from('community_subscription_settings')
            .select('status, current_period_end')
            .eq('community_id', community.id)
            .maybeSingle(),

        user ? supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', user.id)
            .single() : Promise.resolve({ data: null })
    ])

    const channels = channelsResult.data
    const member = memberResult.data
    const notifications = notificationsResult.data
    const subscription = subscriptionResult.data
    const profile = profileResult.data

    let isExpired = false
    if (subscription) {
        if (subscription.status === 'canceled') isExpired = true
        if (subscription.status === 'past_due') isExpired = true
    }

    const isOwner = user?.id === community.owner_id
    const isSuperAdmin = !!profile?.is_super_admin
    const isManager = (member?.role === 'community_manager') || isSuperAdmin
    const isGuard = member?.role ? ['guard', 'head_of_security'].includes(member.role) : false
    const isResident = member?.role === 'resident'
    const isHouseholdHead = !!member?.is_household_head
    const isPending = member?.status === 'pending'

    if (isPending) {
        return (
            <div className="flex min-h-screen flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <div className="flex items-center gap-2 font-semibold">
                        <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                            <Building2 className="h-5 w-5" />
                            <span>Dashboard</span>
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-bold text-primary">{community.name}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <Button variant="ghost" asChild>
                            <Link href="/dashboard">Back to Dashboard</Link>
                        </Button>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center max-w-md space-y-4">
                        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </div>
                        <h1 className="text-2xl font-bold">Pending Approval</h1>
                        <p className="text-muted-foreground">
                            Your request to join <strong>{community.name}</strong> is currently pending approval from the community manager.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            You will receive an email once your request has been approved.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/dashboard">Return to Dashboard</Link>
                        </Button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-muted/20 relative">
            {/* Background Gradients */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-xl px-4 md:px-6 shadow-sm">
                <MobileSidebar>
                    {/* ... Mobile Sidebar Content ... */}
                    {/* Reusing existing logic but in a cleaner structure is tricky without re-writing everything. 
                        I will inject the exact same nav content here but styled. 
                        Since the MobileSidebar children were just passed through, I should keep the content same but maybe wrap it differently?
                        Actually, the content passed to MobileSidebar in the original code imports Buttons/Links. 
                        I will assume the children passed here are the same as before. 
                    */}
                    <div className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        <span>Message Boards</span>
                    </div>
                    <nav className="px-2 space-y-1">
                        {channels?.map((channel) => (
                            <Button
                                key={channel.id}
                                variant="ghost"
                                className="w-full justify-start font-medium"
                                asChild
                            >
                                <Link href={`/communities/${slug}/${channel.slug}`}>
                                    # <span className="ml-1">{channel.name}</span>
                                </Link>
                            </Button>
                        ))}

                        {isManager && (
                            <div className="pt-2 mt-2 border-t border-border/50">
                                <CreateChannelDialog
                                    communityId={community.id}
                                    communitySlug={community.slug}
                                />
                            </div>
                        )}
                    </nav>

                    <div className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-between mt-4 border-t border-border/50 pt-4">
                        <span>Access</span>
                    </div>
                    <nav className="px-2 space-y-1">
                        {!isGuard && (
                            <Button variant="ghost" className="w-full justify-start" asChild>
                                <Link href={`/communities/${slug}/visitors`}>
                                    My Visitors
                                </Link>
                            </Button>
                        )}

                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <Link href={`/communities/${slug}/profile`}>
                                My Profile
                            </Link>
                        </Button>

                        {isHouseholdHead && (
                            <Button variant="ghost" className="w-full justify-start" asChild>
                                <Link href={`/communities/${slug}/household`}>
                                    My Household
                                </Link>
                            </Button>
                        )}

                        {/* Manager Dashboard */}
                        {isManager && (
                            <>
                                <Button variant="ghost" className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                                    <Link href={`/communities/${slug}/manager`}>
                                        Manager Dashboard
                                    </Link>
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                                    <Link href={`/communities/${slug}/manager/security`}>
                                        Security Management
                                    </Link>
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                                    <Link href={`/communities/${slug}/manager/settings/features`}>
                                        Feature Settings
                                    </Link>
                                </Button>
                            </>
                        )}

                        {/* Security Section - Only for managers/guards */}
                        {(isManager || isGuard) && (
                            <>
                                <div className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-between mt-4 border-t border-border/50 pt-4">
                                    <span>Security</span>
                                </div>
                                <nav className="px-2 space-y-1">
                                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" asChild>
                                        <Link href={`/communities/${slug}/security`}>
                                            Security Station
                                        </Link>
                                    </Button>
                                </nav>
                            </>
                        )}

                        <div className="pt-4 mt-4 border-t border-border/50">
                            <SignOutButton />
                        </div>
                    </nav>
                </MobileSidebar>
                <div className="flex items-center gap-3 font-semibold">
                    <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors hidden md:flex">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm">Dashboard</span>
                    </Link>
                    <span className="text-muted-foreground/40 hidden md:inline">/</span>
                    <span className="font-bold text-foreground tracking-tight text-lg">{community.name}</span>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    {user && <NotificationsPopover notifications={notifications || []} />}
                    <Button variant="ghost" asChild className="hidden md:inline-flex text-muted-foreground hover:text-primary">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </header>
            <div className="flex flex-1 container max-w-7xl mx-auto md:px-6 md:py-6 gap-6">
                <aside className="w-72 hidden md:flex flex-col h-[calc(100vh-8rem)] sticky top-24 rounded-2xl glass-panel border-white/20 dark:border-white/10 shadow-sm overflow-hidden">
                    <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">
                        {/* Message Boards Section */}
                        <div>
                            <div className="px-2 text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-3 flex items-center justify-between">
                                <span>Message Boards</span>
                                {isManager && (
                                    <CreateChannelDialog
                                        communityId={community.id}
                                        communitySlug={community.slug}
                                    />
                                )}
                            </div>
                            <nav className="space-y-1">
                                <CommunitySidebarChannels
                                    communitySlug={community.slug}
                                    channels={channels || []}
                                />
                            </nav>
                        </div>

                        {/* Access Section */}
                        <div>
                            <div className="px-2 text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-3">
                                Access & Profile
                            </div>
                            <nav className="space-y-1">
                                {!isGuard && (
                                    <Button variant="ghost" className="w-full justify-start rounded-xl px-3 py-2.5 h-auto font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 hover:shadow-sm transition-all duration-200" asChild>
                                        <Link href={`/communities/${slug}/visitors`}>
                                            <Users className="mr-2 h-4 w-4" />
                                            My Visitors
                                        </Link>
                                    </Button>
                                )}

                                <Button variant="ghost" className="w-full justify-start rounded-xl px-3 py-2.5 h-auto font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 hover:shadow-sm transition-all duration-200" asChild>
                                    <Link href={`/communities/${slug}/profile`}>
                                        <User className="mr-2 h-4 w-4" />
                                        My Profile
                                    </Link>
                                </Button>

                                {isHouseholdHead && (
                                    <Button variant="ghost" className="w-full justify-start rounded-xl px-3 py-2.5 h-auto font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 hover:shadow-sm transition-all duration-200" asChild>
                                        <Link href={`/communities/${slug}/household`}>
                                            <Home className="mr-2 h-4 w-4" />
                                            My Household
                                        </Link>
                                    </Button>
                                )}
                            </nav>
                        </div>

                        {/* Manager Section */}
                        {isManager && (
                            <div>
                                <div className="px-2 text-xs font-bold text-blue-600/60 uppercase tracking-wider mb-3 mt-4">
                                    Management
                                </div>
                                <nav className="space-y-1">
                                    <Button variant="ghost" className="w-full justify-start rounded-xl px-3 py-2.5 h-auto font-medium text-muted-foreground hover:text-blue-600 hover:bg-blue-50/50 hover:shadow-sm transition-all duration-200" asChild>
                                        <Link href={`/communities/${slug}/manager`}>
                                            Manager Dashboard
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start rounded-xl px-3 py-2.5 h-auto font-medium text-muted-foreground hover:text-blue-600 hover:bg-blue-50/50 hover:shadow-sm transition-all duration-200" asChild>
                                        <Link href={`/communities/${slug}/manager/security`}>
                                            Security Management
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start rounded-xl px-3 py-2.5 h-auto font-medium text-muted-foreground hover:text-blue-600 hover:bg-blue-50/50 hover:shadow-sm transition-all duration-200" asChild>
                                        <Link href={`/communities/${slug}/manager/settings/features`}>
                                            Feature Settings
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start rounded-xl px-3 py-2.5 h-auto font-medium text-muted-foreground hover:text-blue-600 hover:bg-blue-50/50 hover:shadow-sm transition-all duration-200" asChild>
                                        <Link href={`/communities/${slug}/manager/billing`}>
                                            Billing
                                        </Link>
                                    </Button>
                                </nav>
                            </div>
                        )}

                        {/* Security Section */}
                        {(isManager || isGuard) && (
                            <div>
                                <div className="px-2 text-xs font-bold text-red-600/60 uppercase tracking-wider mb-3 mt-4">
                                    Security
                                </div>
                                <nav className="space-y-1">
                                    <Button variant="ghost" className="w-full justify-start rounded-xl px-3 py-2.5 h-auto font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50/50 hover:shadow-sm transition-all duration-200" asChild>
                                        <Link href={`/communities/${slug}/security`}>
                                            Security Station
                                        </Link>
                                    </Button>
                                </nav>
                            </div>
                        )}
                    </div>
                </aside>

                <main className="flex-1 w-full min-w-0 pb-24 md:pb-0">
                    <SubscriptionEnforcer
                        isExpired={isExpired}
                        isManager={isManager}
                        communitySlug={slug}
                    >
                        {children}
                    </SubscriptionEnforcer>
                </main>
            </div>
            <MobileCommunityNav slug={slug} isManager={isManager} isGuard={isGuard} />
        </div>
    )
}
