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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ChevronLeft, Trash2, UserPlus } from 'lucide-react'
import { addManager, removeManager } from './actions'
import { revalidatePath } from 'next/cache'

export default async function CommunityMembersPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const { id } = await params

    const { data: community } = await supabase
        .from('communities')
        .select('name, slug')
        .eq('id', id)
        .single()

    const { data: managers } = await supabase
        .from('members')
        .select(`
            id,
            user_id,
            role,
            status,
            profiles (
                full_name,
                email
            )
        `)
        .eq('community_id', id)
        .eq('role', 'community_manager')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/communities">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {community?.name}: Managers
                    </h1>
                    <p className="text-muted-foreground">
                        Manage community managers.
                    </p>
                </div>
            </div>

            <div className="flex gap-4 items-end border p-4 rounded-lg bg-muted/30">
                <form action={async (formData) => {
                    'use server'
                    const email = formData.get('email') as string
                    await addManager(id, email)
                }} className="flex w-full max-w-sm items-center space-x-2">
                    <Input type="email" name="email" placeholder="User Email" required />
                    <Button type="submit">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Manager
                    </Button>
                </form>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {managers?.map((manager: any) => (
                            <TableRow key={manager.id}>
                                <TableCell className="font-medium">
                                    {manager.profiles.full_name || 'N/A'}
                                </TableCell>
                                <TableCell>{manager.profiles.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{manager.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <form action={async () => {
                                        'use server'
                                        await removeManager(id, manager.user_id)
                                    }}>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </TableCell>
                            </TableRow>
                        ))}
                        {managers?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No managers found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
