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
import Link from 'next/link'
import { Settings } from 'lucide-react'

export default async function AdminCommunitiesPage() {
    const supabase = await createClient()

    const { data: communities } = await supabase
        .from('communities')
        .select(`
            id,
            name,
            slug,
            created_at,
            members:members(count)
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Communities</h1>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {communities?.map((community: any) => (
                            <TableRow key={community.id}>
                                <TableCell className="font-medium">{community.name}</TableCell>
                                <TableCell>{community.slug}</TableCell>
                                <TableCell>{community.members[0]?.count || 0}</TableCell>
                                <TableCell>{new Date(community.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/admin/communities/${community.id}/features`}>
                                            <Settings className="h-4 w-4" />
                                            <span className="sr-only">Manage Features</span>
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
