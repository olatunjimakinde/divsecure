import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { payBill } from '../../../billing/actions'

export default async function HouseholdBillingPage({
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

    // Get Member & Household
    const { data: member } = await supabase
        .from('members')
        .select('household_id')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .single()

    if (!member || !member.household_id) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">No Household Assigned</h1>
                <p className="text-muted-foreground">
                    You must be part of a household to view bills.
                </p>
            </div>
        )
    }

    // Get Bills
    const { data: bills } = await supabase
        .from('bills')
        .select('*')
        .eq('household_id', member.household_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Bills</h1>
                <p className="text-muted-foreground">
                    View and pay bills for your household.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bills?.map((bill) => (
                    <Card key={bill.id} className={bill.status === 'paid' ? 'opacity-75' : ''}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{bill.title}</CardTitle>
                                    <CardDescription>
                                        Due: {new Date(bill.due_date).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <Badge variant={
                                    bill.status === 'paid' ? 'default' :
                                        bill.status === 'overdue' ? 'destructive' : 'secondary'
                                }>
                                    {bill.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold mb-2">${bill.amount}</div>
                            {bill.description && (
                                <p className="text-sm text-muted-foreground">{bill.description}</p>
                            )}
                        </CardContent>
                        <CardFooter>
                            {bill.status !== 'paid' && (
                                <form action={async (formData) => {
                                    'use server'
                                    await payBill(formData)
                                }} className="w-full">
                                    <input type="hidden" name="billId" value={bill.id} />
                                    <input type="hidden" name="amount" value={bill.amount} />
                                    <input type="hidden" name="communitySlug" value={slug} />
                                    <Button className="w-full">Pay Now</Button>
                                </form>
                            )}
                            {bill.status === 'paid' && (
                                <Button variant="outline" className="w-full" disabled>Paid</Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
                {!bills?.length && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                        No bills found.
                    </div>
                )}
            </div>
        </div>
    )
}
