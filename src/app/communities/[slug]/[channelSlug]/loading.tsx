import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between px-6 py-3 border-b bg-background/95">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-9 rounded-md" />
            </div>

            <div className="flex-1 overflow-hidden p-4 space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-16 w-full max-w-2xl rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t bg-background">
                <Skeleton className="h-24 w-full rounded-md" />
                <div className="flex justify-end mt-2">
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>
        </div>
    )
}
