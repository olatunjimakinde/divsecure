"use client"

import { useState } from "react"
import {
    MoreHorizontal,
    Pencil,
    Trash
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
import { updateBill, deleteBill } from "../../../../billing/actions"

interface BillActionsProps {
    bill: any
    slug: string
}

export function BillActions({ bill, slug }: BillActionsProps) {
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
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Bill</DialogTitle>
                        </DialogHeader>
                        <form action={async (formData) => {
                            await updateBill(formData)
                            setIsEditOpen(false)
                        }}>
                            <input type="hidden" name="billId" value={bill.id} />
                            <input type="hidden" name="communitySlug" value={slug} />
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input name="title" defaultValue={bill.title} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Amount</Label>
                                    <Input name="amount" type="number" step="0.01" defaultValue={bill.amount} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Due Date</Label>
                                    <Input name="dueDate" type="date" defaultValue={bill.due_date.split('T')[0]} required />
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
                        await deleteBill(formData)
                    }} className="w-full">
                        <input type="hidden" name="billId" value={bill.id} />
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
