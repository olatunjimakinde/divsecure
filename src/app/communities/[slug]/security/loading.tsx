import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-64 mt-2" />
            </div>

            <div className="flex gap-2 border-b">
                <Skeleton className="h-10 w-24 rounded-t-lg" />
                <Skeleton className="h-10 w-24 rounded-t-lg" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-0">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
