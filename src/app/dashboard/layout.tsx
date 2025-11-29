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
            <aside className="hidden w-64 flex-col border-r bg-background md:flex">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                        <div className="relative h-8 w-8">
                            <Image src="/logo-icon.png" alt="DivSecure Logo" fill className="object-contain" />
                        </div>
                        <span className="">
                            <span className="font-bold">Div</span>secure
                        </span>
                    </Link>
                </div>
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
                </nav>
                <div className="mt-auto p-4">
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
