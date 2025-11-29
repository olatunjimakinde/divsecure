'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Copy, Check, MoreHorizontal, Calendar, Ban, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import { deleteVisitorCode, toggleVisitorCodeStatus, rescheduleVisitorCode } from '../../visitors/actions'
import { ConfirmationDialog } from '@/components/confirmation-dialog'

interface VisitorCode {
    id: string
    visitor_name: string
    access_code: string
    valid_from: string
    valid_until: string
    used_at: string | null
    is_one_time: boolean
    vehicle_plate: string | null
    community_id: string
    is_active: boolean
}

interface VisitorListProps {
    codes: VisitorCode[]
    communitySlug: string
}

export function VisitorList({ codes, communitySlug }: VisitorListProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [rescheduleCode, setRescheduleCode] = useState<VisitorCode | null>(null)
    const [deleteCodeId, setDeleteCodeId] = useState<string | null>(null)
    const [toggleStatusId, setToggleStatusId] = useState<string | null>(null)

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedId(id)
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const getStatus = (code: VisitorCode) => {
        if (code.is_active === false) return { label: 'Suspended', variant: 'destructive' as const }
        if (code.used_at) return { label: 'Used', variant: 'secondary' as const }

        const now = new Date()
        const validUntil = new Date(code.valid_until)
        if (now > validUntil) return { label: 'Expired', variant: 'outline' as const }

        return { label: 'Active', variant: 'default' as const }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    }

    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateTimeInput = (dateString: string) => {
        return new Date(dateString).toISOString().slice(0, 16)
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Visitor</TableHead>
                        <TableHead>Valid Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {codes.map((code) => {
                        const status = getStatus(code)
                        return (
                            <TableRow key={code.id} className={status.label === 'Expired' || status.label === 'Used' ? 'bg-muted/30' : ''}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-mono font-bold text-lg px-2 py-1 rounded ${status.label === 'Suspended' ? 'bg-destructive/10 text-destructive line-through' : 'bg-muted'}`}>
                                            {code.access_code}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => copyToClipboard(code.access_code, code.id)}
                                        >
                                            {copiedId === code.id ? (
                                                <Check className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                            <span className="sr-only">Copy code</span>
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{code.visitor_name}</span>
                                        {code.vehicle_plate && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                🚗 {code.vehicle_plate}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm text-muted-foreground">
                                        <span>{formatDate(code.valid_from)}</span>
                                        <span className="text-xs">to {formatDate(code.valid_until)}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={status.variant} className="capitalize">
                                        {status.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => setRescheduleCode(code)}>
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Reschedule
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setToggleStatusId(code.id)}>
                                                {code.is_active ? (
                                                    <>
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        Suspend
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlayCircle className="mr-2 h-4 w-4" />
                                                        Activate
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => setDeleteCodeId(code.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {/* Reschedule Dialog */}
            <Dialog open={!!rescheduleCode} onOpenChange={(open) => !open && setRescheduleCode(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reschedule Visitor Code</DialogTitle>
                        <DialogDescription>
                            Update the validity period for {rescheduleCode?.visitor_name}'s access code.
                        </DialogDescription>
                    </DialogHeader>
                    {rescheduleCode && (
                        <form action={async (formData) => {
                            try {
                                const result = await rescheduleVisitorCode(formData)
                                if (result?.error) {
                                    console.error('Server error:', result.error)
                                    alert(result.error)
                                } else {
                                    setRescheduleCode(null)
                                }
                            } catch (error) {
                                console.error('Failed to reschedule:', error)
                            }
                        }}>
                            <input type="hidden" name="codeId" value={rescheduleCode.id} />
                            <input type="hidden" name="communitySlug" value={communitySlug} />
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="validFrom" className="text-right">
                                        Valid From
                                    </Label>
                                    <Input
                                        id="validFrom"
                                        name="validFrom"
                                        type="datetime-local"
                                        defaultValue={formatDateTimeInput(rescheduleCode.valid_from)}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="validUntil" className="text-right">
                                        Valid Until
                                    </Label>
                                    <Input
                                        id="validUntil"
                                        name="validUntil"
                                        type="datetime-local"
                                        defaultValue={formatDateTimeInput(rescheduleCode.valid_until)}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Save changes</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmationDialog
                open={!!deleteCodeId}
                onOpenChange={(open) => !open && setDeleteCodeId(null)}
                trigger={null}
                title="Delete Visitor Code"
                description="Are you sure you want to delete this visitor code? This action cannot be undone."
                actionLabel="Delete"
                variant="destructive"
                onConfirm={async () => {
                    if (deleteCodeId) {
                        const formData = new FormData()
                        formData.append('codeId', deleteCodeId)
                        formData.append('communitySlug', communitySlug)
                        await deleteVisitorCode(formData)
                    }
                }}
            />

            {/* Suspend/Activate Confirmation */}
            <ConfirmationDialog
                open={!!toggleStatusId}
                onOpenChange={(open) => !open && setToggleStatusId(null)}
                trigger={null}
                title={codes.find(c => c.id === toggleStatusId)?.is_active ? "Suspend Visitor Code" : "Activate Visitor Code"}
                description={codes.find(c => c.id === toggleStatusId)?.is_active
                    ? "Are you sure you want to suspend this code? The visitor will be denied entry."
                    : "Are you sure you want to activate this code?"}
                actionLabel={codes.find(c => c.id === toggleStatusId)?.is_active ? "Suspend" : "Activate"}
                variant={codes.find(c => c.id === toggleStatusId)?.is_active ? "destructive" : "default"}
                onConfirm={async () => {
                    if (toggleStatusId) {
                        const code = codes.find(c => c.id === toggleStatusId)
                        if (code) {
                            const formData = new FormData()
                            formData.append('codeId', toggleStatusId)
                            formData.append('communitySlug', communitySlug)
                            formData.append('isActive', (!code.is_active).toString())
                            await toggleVisitorCodeStatus(formData)
                        }
                    }
                }}
            />
        </div>
    )
}
