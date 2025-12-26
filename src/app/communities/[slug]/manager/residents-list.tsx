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
                email,
                status
            )
        `)
        .eq('community_id', communityId)
        .eq('role', 'resident')
        .neq('profiles.status', 'removed')
        .order('created_at', { ascending: false })

    if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`, { foreignTable: 'profiles' })
    }

    const { data: residents } = await query

    if (!residents?.length) {
        return <div className="text-center py-4 text-muted-foreground">No residents found.</div>
    }

    return (
        <>
            <div className="rounded-md border hidden md:block">
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
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
                {residents.map((resident) => (
                    <div key={resident.id} className="relative overflow-hidden rounded-xl border border-white/20 bg-white/5 backdrop-blur-md shadow-sm transition-all hover:bg-white/10">
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-foreground truncate text-base">{resident.profiles?.full_name || 'Unknown'}</span>
                                        {resident.is_household_head && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/20 shrink-0">Head</Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground truncate">{resident.profiles?.email}</div>
                                </div>
                                <Badge variant={resident.status === 'approved' ? 'default' : 'secondary'} className={`shrink-0 capitalize ${resident.status === 'approved' ? 'bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 border-green-500/20' : ''}`}>
                                    {resident.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-black/5 dark:bg-white/5 mb-4">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Unit</span>
                                    <p className="text-sm font-medium text-foreground truncate">{resident.households?.name || resident.unit_number || '-'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Joined</span>
                                    <p className="text-sm font-medium text-foreground">{new Date(resident.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {resident.status === 'pending' ? (
                                    <>
                                        <form action={approveResident} className="flex-1">
                                            <input type="hidden" name="memberId" value={resident.id} />
                                            <input type="hidden" name="communityId" value={communityId} />
                                            <input type="hidden" name="communitySlug" value={communitySlug} />
                                            <Button size="sm" className="w-full font-medium shadow-md shadow-primary/20">Approve</Button>
                                        </form>
                                        <RejectResidentButton memberId={resident.id} communityId={communityId} communitySlug={communitySlug} />
                                    </>
                                ) : (
                                    <div className="w-full">
                                        <ResidentActions resident={resident} communityId={communityId} communitySlug={communitySlug} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
