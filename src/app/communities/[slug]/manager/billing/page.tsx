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
import { RecurringChargeActions } from './_components/recurring-charge-actions'
import { BillActions } from './_components/bill-actions'
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

    // Get Billing Settings
    const { data: settings } = await supabase
        .from('billing_settings')
        .select('*')
        .eq('community_id', community.id)
        .single()

    // Get Recurring Charges
    const { data: recurringCharges } = await supabase
        .from('recurring_charges')
        .select('*')
        .eq('community_id', community.id)
        .order('created_at', { ascending: false })

    // ... existing bills query ...
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

    // ... existing households query ...
    const { data: households } = await supabase
        .from('households')
        .select('id, name')
        .eq('community_id', community.id)
        .order('name')

    // Import actions
    const { updateBillingSettings } = await import('../../../billing/settings-actions')
    const {
        createRecurringCharge,
        generateBillsFromRecurring,
        updateRecurringCharge,
        deleteRecurringCharge,
        toggleRecurringChargeStatus
    } = await import('../../../billing/recurring-actions')

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
                    <p className="text-muted-foreground">
                        Manage estate bills, recurring charges, and enforcement rules.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto justify-center">Billing Settings</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Billing Settings</DialogTitle>
                                <DialogDescription>
                                    Configure payment enforcement and rules.
                                </DialogDescription>
                            </DialogHeader>
                            <form action={async (formData) => {
                                'use server'
                                await updateBillingSettings(formData)
                            }}>
                                <input type="hidden" name="communityId" value={community.id} />
                                <input type="hidden" name="communitySlug" value={slug} />
                                <div className="grid gap-4 py-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="blockAccessCodes"
                                            name="blockAccessCodes"
                                            value="true"
                                            className="h-4 w-4 rounded border-gray-300"
                                            defaultChecked={settings?.block_access_codes_if_unpaid}
                                        />
                                        <Label htmlFor="blockAccessCodes">Block Access Codes if Unpaid</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="securityGuardExempt"
                                            name="securityGuardExempt"
                                            value="true"
                                            className="h-4 w-4 rounded border-gray-300"
                                            defaultChecked={settings?.security_guard_exempt ?? true}
                                        />
                                        <Label htmlFor="securityGuardExempt">Exempt Security Guards</Label>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="gracePeriodDays">Grace Period (Days)</Label>
                                        <Input
                                            id="gracePeriodDays"
                                            name="gracePeriodDays"
                                            type="number"
                                            min="0"
                                            defaultValue={settings?.grace_period_days || 0}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Save Settings</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto justify-center shadow-lg shadow-primary/20">
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
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Recurring Charges</CardTitle>
                            <CardDescription>
                                Setup automatic bills for maintenance, security, etc.
                            </CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Recurring Charge
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>New Recurring Charge</DialogTitle>
                                    <DialogDescription>Create a template for recurring bills</DialogDescription>
                                </DialogHeader>
                                <form action={async (formData) => {
                                    'use server'
                                    await createRecurringCharge(formData)
                                }}>
                                    <input type="hidden" name="communityId" value={community.id} />
                                    <input type="hidden" name="communitySlug" value={slug} />
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="rec-title">Title</Label>
                                            <Input id="rec-title" name="title" placeholder="e.g. Monthly Maintenance" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="rec-amount">Amount</Label>
                                            <Input id="rec-amount" name="amount" type="number" step="0.01" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="frequency">Frequency</Label>
                                            <Select name="frequency" required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select frequency" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                                    <SelectItem value="yearly">Yearly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">Create</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {/* Desktop Table */}
                        <div className="hidden md:block rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Frequency</TableHead>
                                        <TableHead>Last Generated</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recurringCharges?.map((charge) => (
                                        <TableRow key={charge.id}>
                                            <TableCell className="font-medium">{charge.title}</TableCell>
                                            <TableCell>₦{charge.amount}</TableCell>
                                            <TableCell className="capitalize">{charge.frequency}</TableCell>
                                            <TableCell>
                                                {charge.last_generated_at
                                                    ? new Date(charge.last_generated_at).toLocaleDateString()
                                                    : 'Never'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={charge.active ? 'default' : 'secondary'}>
                                                    {charge.active ? 'Active' : 'Paused'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <RecurringChargeActions charge={charge} communityId={community.id} slug={slug} />                                        </TableCell>
                                        </TableRow>
                                    ))}
                                    {!recurringCharges?.length && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                                No recurring charges configured.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Grid */}
                        <div className="grid gap-4 md:hidden">
                            {recurringCharges?.map((charge) => (
                                <div key={charge.id} className="flex flex-col gap-3 rounded-lg border p-4 shadow-sm bg-card hover:bg-muted/5 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold">{charge.title}</div>
                                            <div className="text-sm text-muted-foreground capitalize">{charge.frequency}</div>
                                        </div>
                                        <Badge variant={charge.active ? 'default' : 'secondary'}>
                                            {charge.active ? 'Active' : 'Paused'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="text-lg font-bold">₦{charge.amount}</div>
                                        <RecurringChargeActions charge={charge} communityId={community.id} slug={slug} />
                                    </div>
                                    <div className="text-xs text-muted-foreground border-t pt-2 mt-1">
                                        Last generated: {charge.last_generated_at
                                            ? new Date(charge.last_generated_at).toLocaleDateString()
                                            : 'Never'}
                                    </div>
                                </div>
                            ))}
                            {!recurringCharges?.length && (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    No recurring charges configured.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Issued Bills</CardTitle>
                        <CardDescription>
                            History of all bills issued.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Desktop Table */}
                        <div className="hidden md:block rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Household</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Action</TableHead>
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
                                            <TableCell>₦{bill.amount}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    bill.status === 'paid' ? 'default' :
                                                        bill.status === 'overdue' ? 'destructive' : 'secondary'
                                                }>
                                                    {bill.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <BillActions bill={bill} slug={slug} />
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
                        </div>

                        {/* Mobile Grid */}
                        <div className="grid gap-4 md:hidden">
                            {bills?.map((bill) => (
                                <div key={bill.id} className="flex flex-col gap-3 rounded-lg border p-4 shadow-sm bg-card hover:bg-muted/5 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold">{bill.title}</div>
                                            <div className="text-sm text-muted-foreground">{bill.households?.name}</div>
                                        </div>
                                        <Badge variant={
                                            bill.status === 'paid' ? 'default' :
                                                bill.status === 'overdue' ? 'destructive' : 'secondary'
                                        }>
                                            {bill.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="text-lg font-bold">₦{bill.amount}</div>
                                        <BillActions bill={bill} slug={slug} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t pt-2 mt-1">
                                        <div>
                                            Issued: {new Date(bill.created_at).toLocaleDateString()}
                                        </div>
                                        <div>
                                            Due: {bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!bills?.length && (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    No bills found.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
