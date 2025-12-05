import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center space-y-2">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="space-y-4 bg-background p-8 rounded-xl border shadow-sm">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full mt-6" />
                </div>
            </div>
        </div>
    )
}
