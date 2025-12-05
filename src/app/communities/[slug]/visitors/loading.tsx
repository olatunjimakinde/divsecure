import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-5 w-48 mt-2" />
            </div>

            <div className="flex gap-2 border-b">
                <Skeleton className="h-10 w-24 rounded-t-lg" />
                <Skeleton className="h-10 w-24 rounded-t-lg" />
            </div>

            <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
