'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, Users, UserPlus, X, Ban, CheckCircle } from 'lucide-react'
import { createHousehold, updateHousehold, deleteHousehold, addMemberToHousehold, removeMemberFromHousehold, bulkCreateHouseholds, toggleHouseholdHead, changeHouseholdHead, suspendHousehold, activateHousehold, inviteMemberToHousehold } from '../../../households/actions'
import { useRouter } from 'next/navigation'

interface Member {
    id: string
    name: string
    email: string
    is_household_head: boolean
}

interface Household {
    id: string
    name: string
    contact_email: string | null
    member_count: number
    members: Member[]
    status: 'active' | 'suspended'
}

interface HouseholdListProps {
    households: Household[]
    unassignedMembers: Member[]
    communityId: string
    communitySlug: string
}

import { uploadHouseholdsCSV } from '../../../households/upload-actions'
import { Upload } from 'lucide-react'

import { ConfirmationDialog } from '@/components/confirmation-dialog'

// ... (existing imports)

export function HouseholdList({ households, unassignedMembers, communityId, communitySlug }: HouseholdListProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingHousehold, setEditingHousehold] = useState<Household | null>(null)
    const [managingHousehold, setManagingHousehold] = useState<Household | null>(null)
    const router = useRouter()

    const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false)
    const [isUploadOpen, setIsUploadOpen] = useState(false)

    // Resident action states
    const [headChangeMember, setHeadChangeMember] = useState<Member | null>(null)
    const [removeMember, setRemoveMember] = useState<Member | null>(null)

    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean
        type: 'suspend' | 'activate' | 'delete' | null
        id: string | null
        title: string
        description: string
    }>({
        isOpen: false,
        type: null,
        id: null,
        title: '',
        description: ''
    })

    const handleAction = async () => {
        if (!confirmation.id || !confirmation.type) return

        const formData = new FormData()
        formData.append('householdId', confirmation.id)
        formData.append('communitySlug', communitySlug)

        try {
            if (confirmation.type === 'suspend') {
                await suspendHousehold(formData)
            } else if (confirmation.type === 'activate') {
                await activateHousehold(formData)
            } else if (confirmation.type === 'delete') {
                await deleteHousehold(formData)
            }
        } catch (error) {
            console.error('Action failed:', error)
            alert('Action failed')
        } finally {
            setConfirmation({ ...confirmation, isOpen: false })
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                </Button>
                <Button variant="outline" onClick={() => setIsBulkCreateOpen(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Bulk Create
                </Button>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Household
                </Button>
            </div>

            {/* ... (Table) ... */}

            {/* Upload Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Households CSV</DialogTitle>
                        <DialogDescription>
                            Upload a CSV file with columns: <code>name</code>, <code>contact_email</code> (optional).
                        </DialogDescription>
                    </DialogHeader>
                    <form action={async (formData) => {
                        const result = await uploadHouseholdsCSV(formData)
                        if (result?.error) {
                            alert(result.error)
                        } else {
                            if (result?.errors) {
                                alert(`Uploaded ${result.count} households. Errors: \n${result.errors.join('\n')}`)
                            } else {
                                alert(`Successfully uploaded ${result.count} households`)
                            }
                            setIsUploadOpen(false)
                        }
                    }}>
                        <input type="hidden" name="communityId" value={communityId} />
                        <input type="hidden" name="communitySlug" value={communitySlug} />
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="file">CSV File</Label>
                                <Input
                                    id="file"
                                    name="file"
                                    type="file"
                                    accept=".csv"
                                    required
                                />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <p>Example CSV format:</p>
                                <pre className="mt-2 rounded bg-muted p-2">
                                    name,contact_email{'\n'}
                                    Unit 101,resident@example.com{'\n'}
                                    Unit 102,
                                </pre>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Upload</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={confirmation.isOpen} onOpenChange={(open) => setConfirmation({ ...confirmation, isOpen: open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{confirmation.title}</DialogTitle>
                        <DialogDescription>
                            {confirmation.description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmation({ ...confirmation, isOpen: false })}>
                            Cancel
                        </Button>
                        <Button
                            variant={confirmation.type === 'delete' || confirmation.type === 'suspend' ? 'destructive' : 'default'}
                            onClick={handleAction}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <div className="rounded-md border hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Residents</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {households.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <p>No households found.</p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => setIsBulkCreateOpen(true)}>
                                                Bulk Create
                                            </Button>
                                            <Button onClick={() => setIsCreateOpen(true)}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create First Household
                                            </Button>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            households.map((household) => (
                                <TableRow key={household.id}>
                                    <TableCell className="font-medium">{household.name}</TableCell>
                                    <TableCell>{household.contact_email || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={household.status === 'active' ? 'default' : 'destructive'}>
                                            {household.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span>{household.member_count}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setManagingHousehold(household)}
                                            >
                                                <Users className="mr-2 h-4 w-4" />
                                                Residents
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingHousehold(household)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={household.status === 'active' ? "text-orange-500 hover:text-orange-600" : "text-green-500 hover:text-green-600"}
                                                onClick={() => setConfirmation({
                                                    isOpen: true,
                                                    type: household.status === 'active' ? 'suspend' : 'activate',
                                                    id: household.id,
                                                    title: household.status === 'active' ? 'Suspend Household' : 'Activate Household',
                                                    description: household.status === 'active'
                                                        ? 'Are you sure you want to suspend this household? Residents will lose access.'
                                                        : 'Are you sure you want to activate this household?'
                                                })}
                                                title={household.status === 'active' ? "Suspend" : "Activate"}
                                            >
                                                {household.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                <span className="sr-only">{household.status === 'active' ? "Suspend" : "Activate"}</span>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setConfirmation({
                                                    isOpen: true,
                                                    type: 'delete',
                                                    id: household.id,
                                                    title: 'Delete Household',
                                                    description: 'Are you sure? This will unassign all residents and delete the household permanently.'
                                                })}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
                {households.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <p>No households found.</p>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsBulkCreateOpen(true)}>
                                    Bulk Create
                                </Button>
                                <Button onClick={() => setIsCreateOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Household
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    households.map((household) => (
                        <div key={household.id} className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm bg-card">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="font-semibold truncate">{household.name}</div>
                                    <div className="text-sm text-muted-foreground truncate">{household.contact_email || '-'}</div>
                                </div>
                                <Badge variant={household.status === 'active' ? 'default' : 'destructive'} className="shrink-0">
                                    {household.status}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{household.member_count} Residents</span>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2 flex-wrap">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setManagingHousehold(household)}
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    Residents
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingHousehold(household)}
                                >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={household.status === 'active' ? "text-orange-500 hover:text-orange-600" : "text-green-500 hover:text-green-600"}
                                    onClick={() => setConfirmation({
                                        isOpen: true,
                                        type: household.status === 'active' ? 'suspend' : 'activate',
                                        id: household.id,
                                        title: household.status === 'active' ? 'Suspend Household' : 'Activate Household',
                                        description: household.status === 'active'
                                            ? 'Are you sure you want to suspend this household? Residents will lose access.'
                                            : 'Are you sure you want to activate this household?'
                                    })}
                                >
                                    {household.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setConfirmation({
                                        isOpen: true,
                                        type: 'delete',
                                        id: household.id,
                                        title: 'Delete Household',
                                        description: 'Are you sure? This will unassign all residents and delete the household permanently.'
                                    })}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Household</DialogTitle>
                        <DialogDescription>
                            Create a new unit or household in the community.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={async (formData) => {
                        const submitButton = document.getElementById('create-household-submit') as HTMLButtonElement
                        if (submitButton) submitButton.disabled = true

                        try {
                            const result = await createHousehold(formData)
                            if (result?.error) {
                                alert(result.error)
                            } else {
                                alert('Invite sent to household successfully.')
                                setIsCreateOpen(false)
                            }
                        } finally {
                            if (submitButton) submitButton.disabled = false
                        }
                    }}>
                        <input type="hidden" name="communityId" value={communityId} />
                        <input type="hidden" name="communitySlug" value={communitySlug} />
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Household Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. Unit 101, Block A"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contactEmail">Contact Email</Label>
                                <Input
                                    id="contactEmail"
                                    name="contactEmail"
                                    type="email"
                                    placeholder="head@household.com"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    An invite will be sent to this email to join the household.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" id="create-household-submit">
                                Create Household
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Bulk Create Dialog */}
            <Dialog open={isBulkCreateOpen} onOpenChange={setIsBulkCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Create Households</DialogTitle>
                        <DialogDescription>
                            Create multiple households at once (e.g., Unit 101 to Unit 110).
                        </DialogDescription>
                    </DialogHeader>
                    <form action={async (formData) => {
                        const result = await bulkCreateHouseholds(formData)
                        if (result?.error) {
                            alert(result.error)
                        } else {
                            setIsBulkCreateOpen(false)
                        }
                    }}>
                        <input type="hidden" name="communityId" value={communityId} />
                        <input type="hidden" name="communitySlug" value={communitySlug} />
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="prefix">Prefix</Label>
                                <Input
                                    id="prefix"
                                    name="prefix"
                                    placeholder="e.g. Unit "
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start">Start Number</Label>
                                    <Input
                                        id="start"
                                        name="start"
                                        type="number"
                                        placeholder="101"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end">End Number</Label>
                                    <Input
                                        id="end"
                                        name="end"
                                        type="number"
                                        placeholder="110"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Create Households</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingHousehold} onOpenChange={(open) => !open && setEditingHousehold(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Household</DialogTitle>
                        <DialogDescription>
                            Update household details.
                        </DialogDescription>
                    </DialogHeader>
                    {editingHousehold && (
                        <form action={async (formData) => {
                            const result = await updateHousehold(formData)
                            if (result?.error) {
                                alert(result.error)
                            } else {
                                setEditingHousehold(null)
                            }
                        }}>
                            <input type="hidden" name="householdId" value={editingHousehold.id} />
                            <input type="hidden" name="communitySlug" value={communitySlug} />
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Household Name</Label>
                                    <Input
                                        id="edit-name"
                                        name="name"
                                        defaultValue={editingHousehold.name}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-contactEmail">Contact Email</Label>
                                    <Input
                                        id="edit-contactEmail"
                                        name="contactEmail"
                                        type="email"
                                        defaultValue={editingHousehold.contact_email || ''}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Manage Residents Dialog */}
            <Dialog open={!!managingHousehold} onOpenChange={(open) => !open && setManagingHousehold(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Residents - {managingHousehold?.name}</DialogTitle>
                        <DialogDescription>
                            Add or remove residents from this household.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Add Resident Section */}
                        <div className="p-4 border rounded-lg bg-muted/50">
                            <h4 className="text-sm font-medium mb-3">Add Resident</h4>
                            <div className="space-y-4">
                                {/* Option 1: Invite by Email */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1.5 block">Invite by Email</Label>
                                    <form action={async (formData) => {
                                        const result = await inviteMemberToHousehold(formData) as any
                                        if (result?.error) {
                                            alert(result.error)
                                        } else {
                                            alert('Invitation sent!')
                                        }
                                    }} className="flex gap-2">
                                        <input type="hidden" name="householdId" value={managingHousehold?.id || ''} />
                                        <input type="hidden" name="communitySlug" value={communitySlug} />
                                        <input type="hidden" name="communityId" value={communityId} />
                                        <Input
                                            name="email"
                                            type="email"
                                            placeholder="new-resident@example.com"
                                            required
                                            className="bg-background"
                                        />
                                        <Button type="submit">
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Invite
                                        </Button>
                                    </form>
                                </div>

                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-muted-foreground/20"></div>
                                    <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground">OR</span>
                                    <div className="flex-grow border-t border-muted-foreground/20"></div>
                                </div>

                                {/* Option 2: Select Unassigned */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1.5 block">Select Unassigned Resident</Label>
                                    <form action={async (formData) => {
                                        const result = await addMemberToHousehold(formData)
                                        if (result?.error) {
                                            alert(result.error)
                                        }
                                    }} className="flex gap-2">
                                        <input type="hidden" name="householdId" value={managingHousehold?.id || ''} />
                                        <input type="hidden" name="communitySlug" value={communitySlug} />
                                        <Select name="memberId">
                                            <SelectTrigger className="w-full bg-background">
                                                <SelectValue placeholder="Select resident..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {unassignedMembers.length === 0 ? (
                                                    <SelectItem value="none" disabled>No unassigned residents found</SelectItem>
                                                ) : (
                                                    unassignedMembers.map(member => (
                                                        <SelectItem key={member.id} value={member.id}>
                                                            {member.name} ({member.email})
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <Button type="submit" variant="secondary" disabled={unassignedMembers.length === 0}>
                                            Add Selected
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Current Residents List */}
                        <div>
                            <h4 className="text-sm font-medium mb-3">Current Residents</h4>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {managingHousehold?.members.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                    No residents assigned to this household.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            managingHousehold?.members.map((member) => (
                                                <TableRow key={member.id}>
                                                    <TableCell>{member.name}</TableCell>
                                                    <TableCell>{member.email}</TableCell>
                                                    <TableCell>
                                                        {member.is_household_head ? (
                                                            <Badge variant="default" className="text-xs">Head</Badge>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-6 text-xs"
                                                                onClick={() => setHeadChangeMember(member)}
                                                            >
                                                                Set as Head
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => setRemoveMember(member)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                            <span className="sr-only">Remove</span>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    {/* Confirmation Dialogs for Resident Actions */}
                    <ConfirmationDialog
                        open={!!headChangeMember}
                        onOpenChange={(open) => !open && setHeadChangeMember(null)}
                        trigger={null}
                        title="Change Household Head"
                        description={`Are you sure you want to make ${headChangeMember?.name} the new Household Head? The previous head will be demoted.`}
                        actionLabel="Confirm Change"
                        onConfirm={async () => {
                            if (headChangeMember && managingHousehold) {
                                const formData = new FormData()
                                formData.append('householdId', managingHousehold.id)
                                formData.append('newHeadMemberId', headChangeMember.id)
                                formData.append('communitySlug', communitySlug)
                                formData.append('communityId', communityId)
                                await changeHouseholdHead(formData)
                            }
                        }}
                    />

                    <ConfirmationDialog
                        open={!!removeMember}
                        onOpenChange={(open) => !open && setRemoveMember(null)}
                        trigger={null}
                        title="Remove Resident"
                        description={`Are you sure you want to remove ${removeMember?.name} from this household?`}
                        actionLabel="Remove"
                        variant="destructive"
                        onConfirm={async () => {
                            if (removeMember) {
                                const formData = new FormData()
                                formData.append('memberId', removeMember.id)
                                formData.append('communitySlug', communitySlug)
                                await removeMemberFromHousehold(formData)
                            }
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
