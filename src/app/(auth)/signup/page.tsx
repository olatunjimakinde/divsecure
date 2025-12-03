import { signInWithGoogle } from '../actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SignupForm } from './signup-form'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'

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
        <div className="flex flex-col items-center w-full px-5 pt-10 max-w-md mx-auto min-h-screen bg-background">
            <Image src="/logo.png" alt="Divsecure" width={90} height={90} className="mb-8 mt-8" priority />

            <h1 className="text-2xl font-bold text-foreground">Create an account</h1>
            <p className="text-muted-foreground text-sm mb-8">Join your community or create a new one.</p>

            <div className="w-full mb-6">
                <form action={signInWithGoogle}>
                    <Button variant="outline" className="w-full h-12 rounded-xl font-semibold" type="submit">
                        <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Sign up with Google
                    </Button>
                </form>
            </div>

            <div className="relative w-full mb-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with email
                    </span>
                </div>
            </div>

            <div className="w-full">
                <SignupForm communities={communities || []} />
            </div>

            {searchParams?.message && (
                <div className="text-destructive text-sm text-center mt-4">
                    {searchParams.message}
                </div>
            )}

            <p className="text-sm mt-8 text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    )
}
