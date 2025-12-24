import Link from "next/link"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    gradient?: boolean
    hoverEffect?: boolean
    asChild?: boolean
}

export function GlassCard({
    children,
    className,
    gradient = false,
    hoverEffect = true,
    asChild = false,
    ...props
}: GlassCardProps) {
    return (
        <div
            className={cn(
                "glass-card rounded-2xl p-6 relative overflow-hidden",
                hoverEffect && "hover:scale-[1.02] active:scale-[0.98] transition-transform duration-300",
                gradient && "bg-gradient-to-br from-white/60 to-white/30 dark:from-white/10 dark:to-white/5",
                className
            )}
            {...props}
        >
            {gradient && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            )}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    )
}
