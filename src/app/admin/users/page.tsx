import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InviteAdminDialog } from './invite-admin-dialog'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    // Fetch all profiles that have an admin_role or are super_admin
    const { data: admins } = await supabase
        .from('profiles' as any)
        .select('*')
        .or('is_super_admin.eq.true,admin_role.neq.null')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
                <InviteAdminDialog />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {admins?.map((admin: any) => (
                            <TableRow key={admin.id}>
                                <TableCell className="font-medium">{admin.full_name || 'N/A'}</TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        {admin.is_super_admin && <Badge>Super Admin</Badge>}
                                        {admin.admin_role && admin.admin_role !== 'super_admin' && (
                                            <Badge variant="secondary">{admin.admin_role.replace('_', ' ')}</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>Active</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
