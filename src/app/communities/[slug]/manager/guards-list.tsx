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
    )
}
