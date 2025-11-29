import { Skeleton } from "@/components/ui/skeleton"

export default function SecurityLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
            </div>
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
        </div>
    )
}
