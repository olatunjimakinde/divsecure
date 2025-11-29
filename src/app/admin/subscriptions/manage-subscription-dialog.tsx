'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { assignPlanToCommunity, updateSubscriptionStatus } from '@/lib/subscriptions'
import { useRouter } from 'next/navigation'
import { CreditCard } from 'lucide-react'

interface ManageSubscriptionDialogProps {
    communityId: string
    communityName: string
    currentPlanId?: string
    currentStatus?: string
    plans: any[]
}

export function ManageSubscriptionDialog({
    communityId,
    communityName,
    currentPlanId,
    currentStatus,
    plans
}: ManageSubscriptionDialogProps) {
    const [open, setOpen] = useState(false)
    const [planId, setPlanId] = useState(currentPlanId || '')
    const [status, setStatus] = useState(currentStatus || 'active')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        setLoading(true)

        // Update Plan if changed
        if (planId && planId !== currentPlanId) {
            await assignPlanToCommunity(communityId, planId)
        }

        // Update Status if changed
        if (status !== currentStatus) {
            await updateSubscriptionStatus(communityId, status)
        }

        setOpen(false)
        router.refresh()
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Subscription</DialogTitle>
                    <DialogDescription>
                        Update subscription for {communityName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="plan" className="text-right">
                            Plan
                        </Label>
                        <Select value={planId} onValueChange={setPlanId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a plan" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name} (${plan.price})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Status
                        </Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="past_due">Past Due</SelectItem>
                                <SelectItem value="canceled">Canceled</SelectItem>
                                <SelectItem value="trialing">Trialing</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
