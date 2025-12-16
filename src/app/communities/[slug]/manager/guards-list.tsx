import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AddGuardDialog, RemoveGuardButton } from './guard-actions'

export async function GuardsList({ communityId, searchQuery }: { communityId: string, searchQuery?: string }) {
    const supabase = await createClient()

    let query = supabase
        .from('members')
        .select(`
            id,
            created_at,
            profiles!inner (
                full_name,
                email
            )
        `)
        .eq('community_id', communityId)
        .eq('role', 'guard')
        .order('created_at', { ascending: false })

    if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`, { foreignTable: 'profiles' })
    }

    const { data: guards } = await query

    if (!guards?.length) {
        return <div className="text-center py-4 text-muted-foreground">No security guards found.</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <AddGuardDialog communityId={communityId} />
            </div>
            <div className="rounded-md border hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {guards.map((guard) => (
                            <TableRow key={guard.id}>
                                <TableCell className="font-medium">{guard.profiles?.full_name || 'Unknown'}</TableCell>
                                <TableCell>{guard.profiles?.email}</TableCell>
                                <TableCell>{new Date(guard.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <RemoveGuardButton memberId={guard.id} communityId={communityId} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
                {guards.map((guard) => (
                    <div key={guard.id} className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm bg-card">
                        <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                                <div className="font-semibold truncate">{guard.profiles?.full_name || 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground truncate">{guard.profiles?.email}</div>
                            </div>
                            <RemoveGuardButton memberId={guard.id} communityId={communityId} />
                        </div>

                        <div className="flex flex-col text-sm">
                            <span className="text-muted-foreground text-xs">Joined</span>
                            <span>{new Date(guard.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
