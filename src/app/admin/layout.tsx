import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Users, Settings, LogOut, Building2, CreditCard } from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'
import { MobileSidebar } from '@/components/mobile-sidebar'
import Image from 'next/image'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Double check admin status (middleware handles it, but good for safety)
    const { data: profile } = await supabaseAdmin
        .from('profiles' as any)
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    if (!profile || !(profile as any).is_super_admin) {
        redirect('/dashboard')
    }

    return (
        <div className="flex h-screen bg-muted/40">
            {/* Sidebar */}
            <aside className="hidden w-64 flex-col border-r bg-background md:flex">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/admin" className="flex items-center gap-2 font-semibold">
                        <div className="relative h-8 w-8">
                            <Image src="/logo-icon.png" alt="DivSecure Logo" fill className="object-contain" />
                        </div>
                        <span className="">
                            <span className="font-bold">Div</span>secure Admin
                        </span>
                    </Link>
                </div>
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4 gap-2">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/communities"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                    >
                        <Users className="h-4 w-4" />
                        Communities
                    </Link>
                    <Link
                        href="/admin/features"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                    >
                        <Settings className="h-4 w-4" />
                        Global Features
                    </Link>
                    <Link
                        href="/admin/users"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                    >
                        <Users className="h-4 w-4" />
                        Admins
                    </Link>
                    <Link
                        href="/admin/subscriptions"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                    >
                        <CreditCard className="h-4 w-4" />
                        Subscriptions
                    </Link>
                </nav>
                <div className="mt-auto p-4">
                    <SignOutButton />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
                    <MobileSidebar>
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4 gap-2">
                            <Link
                                href="/admin"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                            <Link
                                href="/admin/communities"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                            >
                                <Users className="h-4 w-4" />
                                Communities
                            </Link>
                            <Link
                                href="/admin/features"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                            >
                                <Settings className="h-4 w-4" />
                                Global Features
                            </Link>
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                            >
                                <Users className="h-4 w-4" />
                                Admins
                            </Link>
                            <Link
                                href="/admin/subscriptions"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                            >
                                <CreditCard className="h-4 w-4" />
                                Subscriptions
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
                        <span className="text-sm font-medium">Super Admin</span>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
