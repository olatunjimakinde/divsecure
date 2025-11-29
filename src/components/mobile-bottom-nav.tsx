'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
    const pathname = usePathname()

    const links = [
        {
            href: '/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            active: pathname === '/dashboard'
        },
        {
            href: '/communities/create', // Or a list view
            label: 'Communities',
            icon: Building2,
            active: pathname.includes('/communities') && !pathname.includes('/profile')
        },
        {
            href: '/profile', // We might need a global profile page or link to settings
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
