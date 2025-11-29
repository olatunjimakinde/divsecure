import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBill } from '../../../billing/actions'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export default async function ManagerBillingPage({
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

    // Get Bills
    const { data: bills } = await supabase
        .from('bills')
        .select(`
            *,
            households (
                name
            )
        `)
        .eq('community_id', community.id)
        .order('created_at', { ascending: false })

    // Get Households for Create Bill
    const { data: households } = await supabase
        .from('households')
        .select('id, name')
        .eq('community_id', community.id)
        .order('name')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing & Payments</h1>
                    <p className="text-muted-foreground">
                        Manage bills for households in {community.name}
                    </p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Bill
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Bill</DialogTitle>
                            <DialogDescription>
                                Issue a new bill to a household.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            'use server'
                            await createBill(formData)
                        }}>
                            <input type="hidden" name="communityId" value={community.id} />
                            <input type="hidden" name="communitySlug" value={slug} />
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="household">Household</Label>
                                    <Select name="householdId" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select household" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {households?.map((h) => (
                                                <SelectItem key={h.id} value={h.id}>
                                                    {h.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" name="title" placeholder="e.g. Monthly Maintenance" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="amount">Amount</Label>
                                    <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input id="dueDate" name="dueDate" type="date" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Input id="description" name="description" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Bill</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bills</CardTitle>
                    <CardDescription>
                        History of all bills issued.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Household</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Due Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bills?.map((bill) => (
                                <TableRow key={bill.id}>
                                    <TableCell>
                                        {new Date(bill.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{bill.households?.name}</TableCell>
                                    <TableCell>{bill.title}</TableCell>
                                    <TableCell>${bill.amount}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            bill.status === 'paid' ? 'default' :
                                                bill.status === 'overdue' ? 'destructive' : 'secondary'
                                        }>
                                            {bill.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(bill.due_date).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!bills?.length && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No bills found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
