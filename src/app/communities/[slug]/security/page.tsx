import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Clock, CheckCircle, MessageSquare, ShieldCheck, Calendar } from 'lucide-react'
import { clockIn, clockOut } from '../../security/guard-actions'
import { SecurityForm } from './security-form'
import { MessageManagerForm } from './message-manager-form'
import { MessageCenter } from '@/components/messaging/message-center'
import { GuardList } from '../manager/security/guard-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

export default async function GuardSecurityPage({
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

    // Get Member (Guard)
    const { data: member } = await supabase
        .from('members')
        .select('id, role')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .single()

    const { isSuperAdmin } = await import('@/lib/permissions')
    const isSuper = await isSuperAdmin(user.id)

    if (!isSuper && (!member || !['guard', 'head_of_security', 'community_manager'].includes(member.role))) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in duration-700">
                <GlassCard className="max-w-md p-8">
                    <h1 className="text-2xl font-bold mb-4 text-destructive">Unauthorized</h1>
                    <p className="text-muted-foreground mb-6">
                        You do not have access to the security dashboard.
                    </p>
                    <Button asChild>
                        <Link href={`/communities/${slug}`}>Return to Community</Link>
                    </Button>
                </GlassCard>
            </div>
        )
    }

    // Get Shifts (Only if member exists, Super Admin usually doesn't clock in unless they are also a guard)
    let shiftsData = null
    if (member) {
        const { data } = await supabase
            .from('shifts')
            .select('*')
            .eq('guard_id', member.id)
            .order('start_time', { ascending: true })
        shiftsData = data
    }

    const shifts = shiftsData as any[] | null

    // Find Active Shift
    const activeShift = shifts?.find((s: any) => s.status === 'active')

    // Find Next Scheduled Shift
    const nextShift = shifts?.find((s: any) => s.status === 'scheduled' && new Date(s.start_time) > new Date())

    // Get Guards (for Head of Security OR Super Admin)
    let guards = null
    const canViewTeam = isSuper || (member && member.role === 'head_of_security')

    if (canViewTeam) {
        const { data: guardsData } = await supabase
            .from('members')
            .select(`
                id,
                role,
                status,
                profiles (
                    full_name,
                    email
                )
            `)
            .eq('community_id', community.id)
            .in('role', ['guard', 'head_of_security'])
            .order('created_at', { ascending: false })

        guards = guardsData
    }

    // Get Messages
    const { data: allVisibleMessages } = await supabase
        .from('security_messages')
        .select(`
            *,
            sender:profiles!sender_id(full_name, email)
        `)
        .eq('community_id', community.id)
        .order('created_at', { ascending: false })

    const inboxMessagesFiltered = allVisibleMessages?.filter(m => m.sender_id !== user.id)
    const sentMessagesFiltered = allVisibleMessages?.filter(m => m.sender_id === user.id)

    // Get Potential Recipients
    let potentialRecipients: any[] = []

    if (isSuper || (member && (member.role === 'head_of_security' || member.role === 'community_manager'))) {
        // Can message individual guards
        const { data: guardMembers } = await supabase
            .from('members')
            .select(`
                user_id,
                role,
                profiles!user_id(id, full_name, email)
            `)
            .eq('community_id', community.id)
            .in('role', ['guard', 'head_of_security'])

        potentialRecipients = guardMembers?.map(m => ({
            id: m.profiles.id,
            name: m.profiles.full_name || m.profiles.email,
            role: m.role
        })) || []
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Security Station</h1>
                <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">{community.name}</span> Security Dashboard
                </p>
            </div>

            <Tabs defaultValue="station" className="space-y-6">
                <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    <TabsList className="inline-flex h-12 w-auto min-w-full justify-start p-1 bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl">
                        <TabsTrigger value="station" className="flex-1 sm:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-lg transition-all duration-300">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Station
                        </TabsTrigger>
                        <TabsTrigger value="messages" className="flex-1 sm:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-lg transition-all duration-300">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Messages
                        </TabsTrigger>
                        <TabsTrigger value="schedule" className="flex-1 sm:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-lg transition-all duration-300">
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule
                        </TabsTrigger>
                        {canViewTeam && (
                            <TabsTrigger value="team" className="flex-1 sm:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-lg transition-all duration-300">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Team
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                {/* STATION TAB */}
                <TabsContent value="station" className="space-y-4 w-full max-w-full outline-none">
                    {/* Shift Status Section */}
                    {activeShift ? (
                        <GlassCard className="border-green-500/30 bg-green-500/5 dark:bg-green-500/10 shadow-sm">
                            <div className="p-6 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                                        <CheckCircle className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-semibold text-lg text-green-700 dark:text-green-400">You are On Duty</h3>
                                </div>
                                <p className="text-muted-foreground mt-2 ml-1">
                                    Shift started at <span className="font-medium text-foreground">{new Date(activeShift.clock_in_time!).toLocaleTimeString()}</span>
                                </p>
                            </div>
                            <div className="p-6 pt-4">
                                <form action={async (formData) => {
                                    'use server'
                                    await clockOut(formData)
                                }}>
                                    <input type="hidden" name="shiftId" value={activeShift.id} />
                                    <input type="hidden" name="communitySlug" value={slug} />
                                    <Button variant="destructive" size="sm" className="shadow-sm">
                                        <Clock className="mr-2 h-4 w-4" />
                                        Clock Out
                                    </Button>
                                </form>
                            </div>
                        </GlassCard>
                    ) : (
                        <>
                            {nextShift ? (
                                <GlassCard className="border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 shadow-sm">
                                    <div className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 mt-1">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-400">Upcoming Shift</h3>
                                                <p className="text-muted-foreground">
                                                    Your next shift is scheduled for{' '}
                                                    <span className="font-medium text-foreground">
                                                        {new Date(nextShift.start_time).toLocaleDateString()} at{' '}
                                                        {new Date(nextShift.start_time).toLocaleTimeString()}
                                                    </span>
                                                    .
                                                </p>
                                                <form action={async (formData) => {
                                                    'use server'
                                                    await clockIn(formData)
                                                }} className="pt-4">
                                                    <input type="hidden" name="shiftId" value={nextShift.id} />
                                                    <input type="hidden" name="communitySlug" value={slug} />
                                                    <Button size="sm" className="shadow-sm">
                                                        <Clock className="mr-2 h-4 w-4" />
                                                        Clock In
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            ) : (
                                <Alert variant="default" className="bg-muted/50 border-muted">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>No Active Shift</AlertTitle>
                                    <AlertDescription>
                                        {member ? 'You do not have an active shift.' : 'Super Admin Mode - No shifts assigned.'}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </>
                    )}

                    {/* Verification Section - Always Visible */}
                    <GlassCard className="border-white/20 dark:border-white/10 shadow-sm hover-effect={false}">
                        <div className="p-6 border-b border-border/50 pb-6 mb-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold tracking-tight">Access Code Verification</h2>
                                <p className="text-sm text-muted-foreground">
                                    Verify visitor access codes.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 pb-6 pt-0">
                            <SecurityForm slug={slug} />
                        </div>
                    </GlassCard>
                </TabsContent>

                {/* MESSAGES TAB */}
                <TabsContent value="messages" className="space-y-4 w-full max-w-full outline-none">
                    <GlassCard className="border-white/20 dark:border-white/10 shadow-sm p-6">
                        <MessageCenter
                            communityId={community.id}
                            communitySlug={slug}
                            userRole={member?.role || (isSuper ? 'head_of_security' : '')}
                            inboxMessages={inboxMessagesFiltered || []}
                            sentMessages={sentMessagesFiltered || []}
                            potentialRecipients={potentialRecipients || []}
                        />
                    </GlassCard>
                </TabsContent>

                {/* SCHEDULE TAB */}
                <TabsContent value="schedule" className="space-y-4 w-full max-w-full outline-none">
                    {/* Upcoming Shifts */}
                    <GlassCard className="border-white/20 dark:border-white/10 shadow-sm">
                        <div className="p-6 border-b border-border/50 pb-6 mb-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold tracking-tight">My Shifts</h2>
                                <p className="text-sm text-muted-foreground">
                                    Your upcoming schedule.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 pb-6 pt-0">
                            <div className="space-y-4">
                                {shifts?.filter(s => s.status === 'scheduled').map((shift) => (
                                    <div key={shift.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-card/50 gap-4 sm:gap-0 hover:bg-muted/50 transition-colors">
                                        <div>
                                            <div className="font-semibold text-lg">
                                                {new Date(shift.start_time).toLocaleDateString()}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(shift.start_time).toLocaleTimeString()} - {new Date(shift.end_time).toLocaleTimeString()}
                                            </div>
                                        </div>
                                        {!activeShift && (
                                            <form action={async (formData) => {
                                                'use server'
                                                await clockIn(formData)
                                            }}>
                                                <input type="hidden" name="shiftId" value={shift.id} />
                                                <input type="hidden" name="communitySlug" value={slug} />
                                                <Button size="sm" className="w-full sm:w-auto shadow-sm">
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    Clock In
                                                </Button>
                                            </form>
                                        )}
                                    </div>
                                ))}
                                {!shifts?.filter(s => s.status === 'scheduled').length && (
                                    <p className="text-center text-muted-foreground py-8 bg-muted/20 rounded-xl border border-dashed">
                                        No upcoming shifts scheduled.
                                    </p>
                                )}
                            </div>
                        </div>
                    </GlassCard>

                    {/* Shift History */}
                    <GlassCard className="border-white/20 dark:border-white/10 shadow-sm">
                        <div className="p-6 border-b border-border/50 pb-6 mb-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold tracking-tight">History</h2>
                            </div>
                        </div>
                        <div className="px-6 pb-6 pt-0">
                            <div className="space-y-2">
                                {shifts?.filter(s => s.status === 'completed').map((shift) => (
                                    <div key={shift.id} className="flex flex-col sm:flex-row sm:justify-between text-sm p-3 hover:bg-muted/50 rounded-lg gap-1 sm:gap-0 transition-colors border border-transparent hover:border-border/50">
                                        <div className="flex justify-between sm:block">
                                            <span className="font-medium">{new Date(shift.start_time).toLocaleDateString()}</span>
                                            <Badge variant="secondary" className="sm:hidden text-[10px] h-5">Completed</Badge>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {new Date(shift.clock_in_time!).toLocaleTimeString()} - {new Date(shift.clock_out_time!).toLocaleTimeString()}
                                        </span>
                                        <Badge variant="secondary" className="hidden sm:inline-flex h-5">Completed</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </TabsContent>

                {/* TEAM TAB */}
                {canViewTeam && (
                    <TabsContent value="team" className="space-y-4 w-full max-w-full outline-none">
                        <GlassCard className="border-white/20 dark:border-white/10 shadow-sm">
                            <div className="p-6 border-b border-border/50 pb-6 mb-6">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-semibold tracking-tight">Access Control Team</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Team overview.
                                    </p>
                                </div>
                            </div>
                            <div className="px-6 pb-6 pt-0">
                                <GuardList
                                    communityId={community.id}
                                    communitySlug={slug}
                                    guards={guards || []}
                                />
                            </div>
                        </GlassCard>
                    </TabsContent>
                )}
            </Tabs>
        </div >
    )
}
