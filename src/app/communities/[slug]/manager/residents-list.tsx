import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { approveResident } from './actions'
import { ResidentActions } from './resident-actions'
import { RejectResidentButton } from './resident-buttons'

export async function ResidentsList({ communityId, communitySlug, searchQuery }: { communityId: string, communitySlug: string, searchQuery?: string }) {
    const supabase = await createClient()

    let query = supabase
        .from('members')
        .select(`
            id,
            unit_number,
            status,
            created_at,
            household_id,
            is_household_head,
            households (
                name
            ),
            profiles!inner (
                full_name,
                email
            )
        `)
        .eq('community_id', communityId)
        .eq('role', 'resident')
        .order('created_at', { ascending: false })

    if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`, { foreignTable: 'profiles' })
    }

    const { data: residents } = await query

    if (!residents?.length) {
        return <div className="text-center py-4 text-muted-foreground">No residents found.</div>
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {residents.map((resident) => (
                    <TableRow key={resident.id}>
                        <TableCell>
                            <div className="font-medium flex items-center gap-2">
                                {resident.profiles?.full_name || 'Unknown'}
                                {resident.is_household_head && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">Head</Badge>
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground">{resident.profiles?.email}</div>
                        </TableCell>
                        <TableCell>
                            {resident.households?.name || resident.unit_number || '-'}
                        </TableCell>
                        <TableCell>
                            <Badge variant={resident.status === 'approved' ? 'default' : 'secondary'}>
                                {resident.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{new Date(resident.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                            {resident.status === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                    <form action={approveResident}>
                                        <input type="hidden" name="memberId" value={resident.id} />
                                        <input type="hidden" name="communityId" value={communityId} />
                                        <input type="hidden" name="communitySlug" value={communitySlug} />
                                        <Button size="sm" variant="default">Approve</Button>
                                    </form>
                                    <RejectResidentButton memberId={resident.id} communityId={communityId} communitySlug={communitySlug} />
                                </div>
                            ) : (
                                <ResidentActions resident={resident} communityId={communityId} communitySlug={communitySlug} />
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
