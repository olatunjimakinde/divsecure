import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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

    if (!member || !['guard', 'head_of_security', 'community_manager'].includes(member.role)) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
                <p className="text-muted-foreground">
                    You do not have access to the security dashboard.
                </p>
            </div>
        )
    }

    // Get Shifts
    const { data: shiftsData } = await supabase
        .from('shifts')
        .select('*')
        .eq('guard_id', member.id)
        .order('start_time', { ascending: true })

    const shifts = shiftsData as any[] | null

    // Find Active Shift
    const activeShift = shifts?.find((s: any) => s.status === 'active')

    // Find Next Scheduled Shift
    const nextShift = shifts?.find((s: any) => s.status === 'scheduled' && new Date(s.start_time) > new Date())

    // Get Guards (for Head of Security)
    let guards = null
    if (member.role === 'head_of_security') {
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

    if (member.role === 'head_of_security' || member.role === 'community_manager') {
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
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Security Station</h1>
                <p className="text-muted-foreground">
                    {community.name} Security Dashboard
                </p>
            </div>

            <Tabs defaultValue="station" className="space-y-4">
                <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <TabsList className="inline-flex h-auto w-auto min-w-full justify-start p-1">
                        <TabsTrigger value="station" className="flex-1 sm:flex-none">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Station
                        </TabsTrigger>
                        <TabsTrigger value="messages" className="flex-1 sm:flex-none">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Messages
                        </TabsTrigger>
                        <TabsTrigger value="schedule" className="flex-1 sm:flex-none">
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule
                        </TabsTrigger>
                        {member.role === 'head_of_security' && (
                            <TabsTrigger value="team" className="flex-1 sm:flex-none">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Team
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                {/* STATION TAB */}
                <TabsContent value="station" className="space-y-4 w-full max-w-full">

                    {/* Shift Status Section */}
                    {activeShift ? (
                        <Card className="border-green-500/50 bg-green-500/10">
                            <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <CardTitle className="text-green-700">You are On Duty</CardTitle>
                                </div>
                                <CardDescription>
                                    Shift started at {new Date(activeShift.clock_in_time!).toLocaleTimeString()}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="p-4 sm:p-6 sm:pt-0 pt-0">
                                <form action={async (formData) => {
                                    'use server'
                                    await clockOut(formData)
                                }}>
                                    <input type="hidden" name="shiftId" value={activeShift.id} />
                                    <input type="hidden" name="communitySlug" value={slug} />
                                    <Button variant="destructive" size="sm">
                                        <Clock className="mr-2 h-4 w-4" />
                                        Clock Out
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    ) : (
                        <>
                            {nextShift ? (
                                <Alert className="border-blue-500/50 bg-blue-500/10">
                                    <Clock className="h-4 w-4" />
                                    <AlertTitle>Upcoming Shift</AlertTitle>
                                    <AlertDescription>
                                        Your next shift is scheduled for{' '}
                                        <span className="font-medium">
                                            {new Date(nextShift.start_time).toLocaleDateString()} at{' '}
                                            {new Date(nextShift.start_time).toLocaleTimeString()}
                                        </span>
                                        .
                                    </AlertDescription>
                                    <form action={async (formData) => {
                                        'use server'
                                        await clockIn(formData)
                                    }} className="mt-4">
                                        <input type="hidden" name="shiftId" value={nextShift.id} />
                                        <input type="hidden" name="communitySlug" value={slug} />
                                        <Button size="sm">
                                            <Clock className="mr-2 h-4 w-4" />
                                            Clock In
                                        </Button>
                                    </form>
                                </Alert>
                            ) : (
                                <Alert variant="default">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>No Active Shift</AlertTitle>
                                    <AlertDescription>
                                        You do not have an active shift.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </>
                    )}

                    {/* Verification Section - Always Visible */}
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle>Access Code Verification</CardTitle>
                            <CardDescription>
                                Verify visitor access codes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <SecurityForm slug={slug} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* MESSAGES TAB */}
                <TabsContent value="messages" className="space-y-4 w-full max-w-full">
                    <MessageCenter
                        communityId={community.id}
                        communitySlug={slug}
                        userRole={member.role}
                        inboxMessages={inboxMessagesFiltered || []}
                        sentMessages={sentMessagesFiltered || []}
                        potentialRecipients={potentialRecipients || []}
                    />
                </TabsContent>

                {/* SCHEDULE TAB */}
                <TabsContent value="schedule" className="space-y-4 w-full max-w-full">
                    {/* Upcoming Shifts */}
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle>My Shifts</CardTitle>
                            <CardDescription>
                                Your upcoming schedule.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <div className="space-y-4">
                                {shifts?.filter(s => s.status === 'scheduled').map((shift) => (
                                    <div key={shift.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 sm:gap-0">
                                        <div>
                                            <div className="font-medium">
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
                                                <Button size="sm" className="w-full sm:w-auto">
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    Clock In
                                                </Button>
                                            </form>
                                        )}
                                    </div>
                                ))}
                                {!shifts?.filter(s => s.status === 'scheduled').length && (
                                    <p className="text-center text-muted-foreground py-4">
                                        No upcoming shifts scheduled.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shift History */}
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle>History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <div className="space-y-2">
                                {shifts?.filter(s => s.status === 'completed').map((shift) => (
                                    <div key={shift.id} className="flex flex-col sm:flex-row sm:justify-between text-sm p-2 hover:bg-muted rounded gap-1 sm:gap-0">
                                        <div className="flex justify-between sm:block">
                                            <span>{new Date(shift.start_time).toLocaleDateString()}</span>
                                            <Badge variant="secondary" className="sm:hidden">Completed</Badge>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {new Date(shift.clock_in_time!).toLocaleTimeString()} - {new Date(shift.clock_out_time!).toLocaleTimeString()}
                                        </span>
                                        <Badge variant="secondary" className="hidden sm:inline-flex">Completed</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TEAM TAB */}
                {member.role === 'head_of_security' && (
                    <TabsContent value="team" className="space-y-4 w-full max-w-full">
                        <GuardList
                            communityId={community.id}
                            communitySlug={slug}
                            guards={guards || []}
                            currentUserId={user.id}
                        />
                    </TabsContent>
                )}
            </Tabs>
        </div >
    )
}
