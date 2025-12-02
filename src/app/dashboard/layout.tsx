import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Building2, User } from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { MobileSidebar } from '@/components/mobile-sidebar'
import Image from 'next/image'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen bg-muted/40">
            {/* Sidebar - Hidden on Mobile */}
            {/* Sidebar - Hidden on Mobile */}
            <aside className="hidden w-72 flex-col border-r bg-card/50 backdrop-blur-xl md:flex">
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/dashboard" className="flex items-center gap-3 font-semibold hover:opacity-80 transition-opacity">
                        <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-primary/10 p-1.5 ring-1 ring-primary/20">
                            <Image src="/logo-icon.png" alt="DivSecure Logo" fill className="object-contain" />
                        </div>
                        <span className="text-lg tracking-tight">
                            <span className="font-bold text-primary">Div</span>secure
                        </span>
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <nav className="grid items-start gap-2 text-sm font-medium">
                        <div className="px-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                            Platform
                        </div>
                        <Link
                            href="/dashboard"
                            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10 hover:shadow-sm"
                        >
                            <LayoutDashboard className="h-4 w-4 transition-transform group-hover:scale-110" />
                            Dashboard
                        </Link>
                        <Link
                            href="/profile"
                            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10 hover:shadow-sm"
                        >
                            <User className="h-4 w-4 transition-transform group-hover:scale-110" />
                            Profile
                        </Link>
                    </nav>
                </div>
                <div className="p-4 border-t bg-muted/20">
                    <SignOutButton />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden mb-16 md:mb-0">
                <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
                    <MobileSidebar>
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4 gap-2">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                            <Link
                                href="/profile"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                            >
                                <User className="h-4 w-4" />
                                Profile
                            </Link>
                            <div className="mt-auto p-4 border-t">
                                <SignOutButton />
                            </div>
                        </nav>
                    </MobileSidebar>
                    <div className="w-full flex-1">
                        {/* Breadcrumbs or Title could go here */}
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Welcome, {user.email}</span>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <MobileBottomNav />
        </div>
    )
}
