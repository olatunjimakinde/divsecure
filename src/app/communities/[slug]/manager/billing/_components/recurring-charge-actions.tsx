"use client"

import { useState } from "react"
import {
    MoreHorizontal,
    Pencil,
    Trash,
    PlayCircle,
    PauseCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    generateBillsFromRecurring,
    updateRecurringCharge,
    deleteRecurringCharge,
    toggleRecurringChargeStatus
} from "../../../../billing/recurring-actions"

interface RecurringChargeActionsProps {
    charge: any // Replace with proper type if available, e.g. defined in a types file
    communityId: string
    slug: string
}

export function RecurringChargeActions({ charge, communityId, slug }: RecurringChargeActionsProps) {
    const [isEditOpen, setIsEditOpen] = useState(false)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                <DropdownMenuItem className="p-0" asChild>
                    <form action={async (formData) => {
                        await generateBillsFromRecurring(formData)
                    }} className="w-full">
                        <input type="hidden" name="communityId" value={communityId} />
                        <input type="hidden" name="communitySlug" value={slug} />
                        <input type="hidden" name="chargeId" value={charge.id} />
                        <button type="submit" className="w-full flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm">
                            <PlayCircle className="mr-2 h-4 w-4" /> Generate Bill
                        </button>
                    </form>
                </DropdownMenuItem>

                <DropdownMenuItem className="p-0" asChild>
                    <form action={async (formData) => {
                        await toggleRecurringChargeStatus(formData)
                    }} className="w-full">
                        <input type="hidden" name="chargeId" value={charge.id} />
                        <input type="hidden" name="communitySlug" value={slug} />
                        <input type="hidden" name="active" value={(!charge.active).toString()} />
                        <button type="submit" className="w-full flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm">
                            {charge.active ? <PauseCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                            {charge.active ? 'Suspend' : 'Activate'}
                        </button>
                    </form>
                </DropdownMenuItem>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Recurring Charge</DialogTitle>
                        </DialogHeader>
                        <form action={async (formData) => {
                            await updateRecurringCharge(formData)
                            setIsEditOpen(false)
                        }}>
                            <input type="hidden" name="chargeId" value={charge.id} />
                            <input type="hidden" name="communitySlug" value={slug} />
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input name="title" defaultValue={charge.title} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Amount</Label>
                                    <Input name="amount" type="number" step="0.01" defaultValue={charge.amount} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Frequency</Label>
                                    <Select name="frequency" defaultValue={charge.frequency} required>
                                        <SelectTrigger>
                                            <SelectValue />
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
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="p-0" asChild>
                    <form action={async (formData) => {
                        await deleteRecurringCharge(formData)
                    }} className="w-full">
                        <input type="hidden" name="chargeId" value={charge.id} />
                        <input type="hidden" name="communitySlug" value={slug} />
                        <button type="submit" className="w-full flex items-center px-2 py-1.5 text-red-600 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm">
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </button>
                    </form>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
