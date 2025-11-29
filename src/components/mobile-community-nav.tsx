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
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg md:hidden">
            <nav className="flex items-center justify-around h-16">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full gap-1 text-xs font-medium transition-colors",
                            link.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <link.icon className="h-5 w-5" />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    )
}
