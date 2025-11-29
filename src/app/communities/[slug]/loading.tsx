import { Skeleton } from "@/components/ui/skeleton"

export default function CommunityLoading() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                <Skeleton className="h-6 w-[200px]" />
            </header>
            <div className="flex flex-1">
                <aside className="w-64 border-r bg-muted/30 hidden md:block p-4 space-y-4">
                    <Skeleton className="h-4 w-[100px]" />
                    <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-9 w-full" />
                        ))}
                    </div>
                </aside>
                <main className="flex-1 p-6 lg:p-8 space-y-6">
                    <Skeleton className="h-8 w-[300px]" />
                    <div className="space-y-4">
                        <Skeleton className="h-[100px] w-full" />
                        <Skeleton className="h-[100px] w-full" />
                    </div>
                </main>
            </div>
        </div>
    )
}
