'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, Users, Shield, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileCommunityNavProps {
    slug: string
    isManager: boolean
    isGuard: boolean
}

export function MobileCommunityNav({ slug, isManager, isGuard }: MobileCommunityNavProps) {
    const pathname = usePathname()

    const links = [
        {
            href: `/communities/${slug}`,
            label: 'Home',
            icon: Home,
            active: pathname === `/communities/${slug}`
        },
        {
            href: `/communities/${slug}/general`, // Default channel
            label: 'Chat',
            icon: MessageSquare,
            active: pathname.includes('/general') || pathname.includes('/announcements')
        },
        // Show Visitors for Residents/Managers, Security for Guards
        ...(isGuard ? [
            {
                href: `/communities/${slug}/security`,
                label: 'Security',
                icon: Shield,
                active: pathname.includes('/security')
            }
        ] : [
            {
                href: `/communities/${slug}/visitors`,
                label: 'Visitors',
                icon: Users,
                active: pathname.includes('/visitors')
            }
        ]),
        {
            href: `/communities/${slug}/profile`,
            label: 'Profile',
            icon: User,
            active: pathname.includes('/profile')
        }
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
            <div className="glass-panel border-b-0 rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <nav className="flex items-center justify-around h-[72px] px-2">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative group",
                                link.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-xl transition-all duration-300",
                                link.active ? "bg-primary/10 translate-y-[-2px]" : "group-hover:bg-muted"
                            )}>
                                <link.icon className={cn("h-6 w-6", link.active && "fill-primary/20")} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium transition-all duration-300",
                                link.active ? "font-semibold" : ""
                            )}>
                                {link.label}
                            </span>
                            {link.active && (
                                <span className="absolute bottom-2 h-1 w-1 rounded-full bg-primary" />
                            )}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    )
}
