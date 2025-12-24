import { signInWithGoogle } from '../actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SignupForm } from './signup-form'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { GlassCard } from '@/components/ui/glass-card'
import { ArrowLeft } from 'lucide-react'

export default async function SignupPage(props: {
    searchParams: Promise<{ message: string }>
}) {
    const searchParams = await props.searchParams
    const supabase = await createClient()

    // Fetch communities for the dropdown
    const { data: communities } = await supabase
        .from('communities')
        .select('id, name')
        .order('name')

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10 bg-gradient-soft opacity-70" />
            <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse" />
            <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] opacity-30" />

            <Link href="/" className="absolute top-8 left-8 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium z-10">
                <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>

            <GlassCard className="w-full max-w-md p-8 md:p-10 border-white/20 dark:border-white/10 shadow-2xl">
                <div className="flex flex-col items-center w-full mb-8 text-center">
                    <div className="relative h-12 w-12 mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg shadow-primary/20">
                        <Image src="/logo-icon.png" alt="DivSecure Logo" fill className="object-cover p-1.5" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Create an account</h1>
                    <p className="text-muted-foreground text-sm">Join your community or create a new one.</p>
                </div>

                <div className="w-full mb-6">
                    <form action={signInWithGoogle}>
                        <Button variant="outline" className="w-full h-12 rounded-xl font-medium bg-white/50 dark:bg-black/50 hover:bg-white/80 dark:hover:bg-black/80 border-border/50" type="submit">
                            <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Sign up with Google
                        </Button>
                    </form>
                </div>

                <div className="relative w-full mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-transparent backdrop-blur-3xl px-2 text-muted-foreground">
                            Or continue with email
                        </span>
                    </div>
                </div>

                <div className="w-full">
                    <SignupForm communities={communities || []} />
                </div>

                {searchParams?.message && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center mt-4 border border-destructive/20">
                        {searchParams.message}
                    </div>
                )}

                <p className="text-sm mt-8 text-muted-foreground text-center">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-semibold hover:underline">
                        Log in
                    </Link>
                </p>
            </GlassCard>
        </div>
    )
}
