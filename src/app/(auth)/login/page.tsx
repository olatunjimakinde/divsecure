import { login, signInWithGoogle, signInAsDemoUser } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import Link from 'next/link'
import Image from 'next/image'

export default async function LoginPage(props: {
    searchParams: Promise<{ message: string; success: string }>
}) {
    const searchParams = await props.searchParams
    return (
        <div className="flex flex-col items-center w-full px-5 pt-10 max-w-md mx-auto min-h-screen bg-background">
            <Image src="/logo.png" alt="Divsecure" width={90} height={90} className="mb-8 mt-8" priority />

            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-sm mb-8">Sign in to continue</p>

            <div className="w-full space-y-3 mb-6">
                <form action={signInWithGoogle}>
                    <Button variant="outline" className="w-full h-12 rounded-xl font-semibold" type="submit">
                        <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Sign in with Google
                    </Button>
                </form>
                <form action={signInAsDemoUser}>
                    <Button variant="secondary" className="w-full h-12 rounded-xl font-semibold" type="submit">
                        Sign in as Demo User
                    </Button>
                </form>
            </div>

            <div className="relative w-full mb-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>

            <form className="w-full space-y-4">
                <div className="space-y-4">
                    <Input name="email" type="email" placeholder="Email" required className="h-12 rounded-xl" />
                    <div className="space-y-1">
                        <PasswordInput name="password" placeholder="Password" required minLength={6} className="h-12 rounded-xl" />
                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    </div>
                </div>

                {searchParams?.message && (
                    <div className="text-destructive text-sm text-center">
                        {searchParams.message}
                    </div>
                )}
                {searchParams?.success && (
                    <div className="text-green-600 text-sm text-center">
                        {searchParams.success}
                    </div>
                )}

                <Button formAction={login} className="w-full h-12 rounded-xl mt-4">Log In</Button>
            </form>

            <p className="text-sm mt-8 text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary font-semibold hover:underline">
                    Sign Up
                </Link>
            </p>
        </div>
    )
}
