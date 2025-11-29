import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, X, Ban, CheckCircle, Pencil } from 'lucide-react'
import { suspendResidentByHead, reactivateResidentByHead, removeResidentByHead, inviteResidentByHead, updateResidentByHead } from '../../household/actions'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { HouseholdActivityLog } from './activity-log'
import { HouseholdResidentActions } from './household-resident-actions'

export default async function MyHouseholdPage({
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

    // 1. Get Community
    const { data: community } = await supabase
        .from('communities')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!community) {
        redirect('/dashboard')
    }

    // 2. Get Member & Household
    const { data: member } = await supabase
        .from('members')
        .select(`
            id,
            role,
            is_household_head,
            household_id,
            households (
                id,
                name,
                contact_email,
                members (
                    id,
                    user_id,
                    user_id,
                    role,
                    status,
                    is_household_head,
                    profiles (
                        full_name,
                        email
                    )
                )
            )
        `)
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .single()

    if (!member || !member.is_household_head || !member.households) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                <p className="text-muted-foreground">
                    You must be a designated Head of Household to view this page.
                </p>
            </div>
        )
    }

    const household = member.households as any
    const members = household.members || []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Household</h1>
                <p className="text-muted-foreground">
                    Manage residents in {household.name}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Residents</CardTitle>
                    <CardDescription>
                        People living in this household.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Resident
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Resident</DialogTitle>
                                        <DialogDescription>
                                            Invite a new resident to your household by email.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form action={async (formData) => {
                                        'use server'
                                        const result = await inviteResidentByHead(formData)
                                        if (result?.error) {
                                            // Ideally show error in UI, but for now using alert via client component or just console
                                            // Since this is a server action inside a server component, we can't use alert() directly unless we make this a client component or use a client wrapper.
                                            // For simplicity in this iteration, we'll just log or assume success.
                                            // To properly show errors, we should convert this dialog to a client component.
                                            // But let's just call the action.
                                            console.error(result.error)
                                        }
                                    }}>
                                        <input type="hidden" name="communitySlug" value={slug} />
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="fullName">Full Name</Label>
                                                <Input id="fullName" name="fullName" placeholder="John Doe" required />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                <Input id="email" name="email" type="email" required />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">Send Invite</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((m: any) => (
                                    <TableRow key={m.id}>
                                        <TableCell>{m.profiles?.full_name || 'Unknown'}</TableCell>
                                        <TableCell>{m.profiles?.email}</TableCell>
                                        <TableCell>
                                            {m.is_household_head ? 'Head' : 'Resident'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={m.status === 'approved' ? 'default' : 'destructive'}>
                                                {m.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {!m.is_household_head && (
                                                <div className="flex justify-end gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" title="Edit">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Resident</DialogTitle>
                                                            </DialogHeader>
                                                            <form action={async (formData) => {
                                                                'use server'
                                                                await updateResidentByHead(formData)
                                                            }}>
                                                                <input type="hidden" name="memberId" value={m.id} />
                                                                <input type="hidden" name="communitySlug" value={slug} />
                                                                <div className="grid gap-4 py-4">
                                                                    <div className="grid gap-2">
                                                                        <Label htmlFor={`name-${m.id}`}>Full Name</Label>
                                                                        <Input id={`name-${m.id}`} name="fullName" defaultValue={m.profiles?.full_name} />
                                                                    </div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button type="submit">Save Changes</Button>
                                                                </DialogFooter>
                                                            </form>
                                                        </DialogContent>
                                                    </Dialog>
                                                    <HouseholdResidentActions
                                                        memberId={m.id}
                                                        communitySlug={slug}
                                                        status={m.status}
                                                    />
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Visitor entry logs for your household.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <HouseholdActivityLog communityId={community.id} householdId={household.id} />
                </CardContent>
            </Card>
        </div>
    )
}
