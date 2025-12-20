import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Shield, ShieldAlert, UserPlus, Calendar, Trash2 } from 'lucide-react'
import { createGuard, toggleGuardStatus, promoteToHead, demoteToGuard, createShift, deleteShift } from '../../../security/actions'
import { SecurityForm } from '../../security/security-form'
import { Checkbox } from '@/components/ui/checkbox'
import { EditGuardDialog } from './edit-guard-dialog'
import { DeleteGuardButton } from './delete-guard-button'
import { CreateGuardDialog } from './create-guard-dialog'
import { GuardList } from './guard-list'

export default async function ManagerSecurityPage({
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

    // Get Guards (and Heads)
    const { data: guards } = await supabase
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

    // Get Shifts
    const { data: shiftsData } = await supabase
        .from('shifts')
        .select(`
            *,
            members (
                profiles (
                    full_name
                )
            )
        `)
        .eq('community_id', community.id)
        .order('start_time', { ascending: true })

    const shifts = shiftsData as any[] | null

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Security Management</h1>
                <p className="text-muted-foreground">
                    Manage your security team and schedules.
                </p>
            </div>

            <Tabs defaultValue="team" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="team">Team Members</TabsTrigger>
                    <TabsTrigger value="shifts">Shift Schedule</TabsTrigger>
                    <TabsTrigger value="verification">Verification</TabsTrigger>
                </TabsList>

                {/* VERIFICATION TAB */}
                <TabsContent value="verification" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Access Code Verification</CardTitle>
                            <CardDescription>
                                Verify visitor access codes directly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SecurityForm slug={slug} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TEAM TAB */}
                <TabsContent value="team" className="space-y-4">
                    <GuardList
                        communityId={community.id}
                        communitySlug={slug}
                        guards={guards || []}
                    />
                </TabsContent>

                {/* SHIFTS TAB */}
                <TabsContent value="shifts" className="space-y-4">
                    <div className="flex justify-end">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Schedule Shift
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Schedule Shift</DialogTitle>
                                    <DialogDescription>
                                        Assign a shift to a guard.
                                    </DialogDescription>
                                </DialogHeader>
                                <form action={async (formData) => {
                                    'use server'
                                    await createShift(formData)
                                }}>
                                    <input type="hidden" name="communityId" value={community.id} />
                                    <input type="hidden" name="communitySlug" value={slug} />
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="guardId">Guard</Label>
                                            <Select name="guardId" required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select guard" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {guards?.map((g) => (
                                                        <SelectItem key={g.id} value={g.id}>
                                                            {g.profiles?.full_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="startTime">Start Time</Label>
                                            <Input id="startTime" name="startTime" type="datetime-local" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="endTime">End Time</Label>
                                            <Input id="endTime" name="endTime" type="datetime-local" required />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">Create Shift</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Shift Schedule</CardTitle>
                            <CardDescription>
                                Upcoming and active shifts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Guard</TableHead>
                                        <TableHead>Start Time</TableHead>
                                        <TableHead>End Time</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shifts?.map((shift) => (
                                        <TableRow key={shift.id}>
                                            <TableCell className="font-medium">
                                                {shift.members?.profiles?.full_name}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(shift.start_time).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(shift.end_time).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    shift.status === 'active' ? 'default' :
                                                        shift.status === 'completed' ? 'secondary' : 'outline'
                                                }>
                                                    {shift.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <form action={async (formData) => {
                                                    'use server'
                                                    await deleteShift(formData)
                                                }}>
                                                    <input type="hidden" name="shiftId" value={shift.id} />
                                                    <input type="hidden" name="communitySlug" value={slug} />
                                                    <Button size="icon" variant="ghost" className="text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!shifts?.length && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No shifts scheduled.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
