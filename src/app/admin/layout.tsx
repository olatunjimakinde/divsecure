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
        <div className="flex min-h-screen bg-muted/20 relative">
            {/* Background Gradients */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

            {/* Sidebar */}
            <aside className="hidden h-[calc(100vh-2rem)] w-64 flex-col fixed left-4 top-4 bottom-4 rounded-2xl glass-panel border-white/20 dark:border-white/10 shadow-lg md:flex overflow-hidden z-20">
                <div className="flex h-16 items-center border-b border-white/10 px-6">
                    <Link href="/admin" className="flex items-center gap-3 font-semibold group">
                        <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-gradient-to-br from-primary to-indigo-600 shadow-md transition-transform group-hover:scale-105">
                            <Image src="/logo-icon.png" alt="DivSecure Logo" fill className="object-cover p-1" />
                        </div>
                        <span className="text-lg tracking-tight">
                            <span className="font-bold text-primary">Div</span>Secure
                        </span>
                    </Link>
                </div>
                <nav className="grid items-start px-3 text-sm font-medium py-4 gap-1">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/communities"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10"
                    >
                        <Users className="h-4 w-4" />
                        Communities
                    </Link>
                    <Link
                        href="/admin/features"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10"
                    >
                        <Settings className="h-4 w-4" />
                        Global Features
                    </Link>
                    <Link
                        href="/admin/users"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10"
                    >
                        <Users className="h-4 w-4" />
                        Admins
                    </Link>
                    <Link
                        href="/admin/subscriptions"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10"
                    >
                        <CreditCard className="h-4 w-4" />
                        Subscriptions
                    </Link>
                </nav>
                <div className="mt-auto p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-2 py-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-background">
                            SA
                        </div>
                        <div className="text-xs">
                            <p className="font-medium">Super Admin</p>
                            <p className="text-muted-foreground truncate max-w-[120px]">{user.email}</p>
                        </div>
                    </div>
                    <SignOutButton />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 pl-0 md:pl-72 transition-all duration-300">
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 bg-background/60 backdrop-blur-xl px-6 shadow-sm border-b border-border/40">
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
                        <span className="text-sm font-medium hidden md:block text-muted-foreground">Admin Portal</span>
                    </div>
                </header>
                <main className="flex-1 p-4 lg:p-8 pt-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
