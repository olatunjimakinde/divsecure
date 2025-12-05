import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-64" />
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Skeleton className="h-10 w-32" />
                        </div>
                        <div className="border rounded-md">
                            <div className="p-4 border-b">
                                <div className="flex gap-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </div>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 border-b last:border-0 flex items-center justify-between">
                                    <div className="flex gap-4 w-full">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-full max-w-md" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
