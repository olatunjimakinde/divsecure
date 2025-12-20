'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Search, Trash2, Home } from 'lucide-react'
import { removeResident } from '@/app/communities/people/actions'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Resident {
    id: string
    unit_number: string | null
    status: string
    role: string
    user_id: string
    profiles: {
        full_name: string | null
        email: string | null
        avatar_url: string | null
    } | null
}

interface ResidentListProps {
    residents: Resident[]
    communitySlug: string
}

export function ResidentList({ residents, communitySlug }: ResidentListProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [userInfo, setUserInfo] = useState<Resident | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const filteredResidents = residents.filter(resident => {
        const name = resident.profiles?.full_name?.toLowerCase() || ''
        const email = resident.profiles?.email?.toLowerCase() || ''
        const unit = resident.unit_number?.toLowerCase() || ''
        const search = searchTerm.toLowerCase()
        return name.includes(search) || email.includes(search) || unit.includes(search)
    })

    const handleDelete = async () => {
        if (!userInfo) return

        const formData = new FormData()
        formData.append('communitySlug', communitySlug)
        formData.append('memberId', userInfo.id)

        const result = await removeResident(formData)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Resident removed successfully')
        }
        setDeleteDialogOpen(false)
        setUserInfo(null)
    }

    const openDeleteDialog = (resident: Resident) => {
        setUserInfo(resident)
        setDeleteDialogOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search residents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredResidents.map((resident) => (
                            <TableRow key={resident.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={resident.profiles?.avatar_url || ''} />
                                            <AvatarFallback>
                                                {resident.profiles?.full_name?.slice(0, 2).toUpperCase() || '??'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{resident.profiles?.full_name || 'Unknown'}</span>
                                            <span className="text-xs text-muted-foreground">{resident.profiles?.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Home className="h-4 w-4 text-muted-foreground" />
                                        <span>{resident.unit_number || 'N/A'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={resident.status === 'approved' ? 'outline' : 'secondary'}>
                                        {resident.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => openDeleteDialog(resident)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remove Resident
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredResidents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No residents found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove <strong>{userInfo?.profiles?.full_name}</strong> from the community.
                            They will lose access to all community channels and resources.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
