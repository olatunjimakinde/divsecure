'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toggleGuardStatus } from '../../../security/actions'
import { EditGuardDialog } from './edit-guard-dialog'
import { DeleteGuardButton } from './delete-guard-button'
import { CreateGuardDialog } from './create-guard-dialog'

interface GuardListProps {
    communityId: string
    communitySlug: string
    guards: any[]
    currentUserId: string
}

export function GuardList({ communityId, communitySlug, guards, currentUserId }: GuardListProps) {
    return (
        <>
            <div className="flex justify-end">
                <CreateGuardDialog communityId={communityId} communitySlug={communitySlug} />
            </div>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Security Team</CardTitle>
                    <CardDescription>
                        Overview of all security personnel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {guards?.map((guard) => (
                                <TableRow key={guard.id}>
                                    <TableCell>
                                        <div className="font-medium">{guard.profiles?.full_name}</div>
                                        <div className="text-sm text-muted-foreground">{guard.profiles?.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={guard.role === 'head_of_security' ? 'default' : 'outline'}>
                                            {guard.role === 'head_of_security' ? 'Head of Security' : 'Guard'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={guard.status === 'approved' ? 'secondary' : 'destructive'}>
                                            {guard.status === 'approved' ? 'Active' : 'Suspended'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* Edit Guard */}
                                            <EditGuardDialog guard={guard} communitySlug={communitySlug} />

                                            {/* Delete Guard - Cannot Delete Self */}
                                            {guard.user_id !== currentUserId && (
                                                <DeleteGuardButton memberId={guard.id} communitySlug={communitySlug} />
                                            )}

                                            {/* Suspend/Activate - Cannot Suspend Self */}
                                            {guard.user_id !== currentUserId && (
                                                <form action={async (formData) => {
                                                    await toggleGuardStatus(null, formData)
                                                }}>
                                                    <input type="hidden" name="memberId" value={guard.id} />
                                                    <input type="hidden" name="communitySlug" value={communitySlug} />
                                                    <input type="hidden" name="currentStatus" value={guard.status} />
                                                    <Button
                                                        size="sm"
                                                        variant={guard.status === 'approved' ? 'ghost' : 'outline'}
                                                        className={guard.status === 'approved' ? 'text-destructive' : 'text-green-600'}
                                                    >
                                                        {guard.status === 'approved' ? 'Suspend' : 'Activate'}
                                                    </Button>
                                                </form>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!guards?.length && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No guards found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
