import { login, signup, signInWithGoogle, signInAsDemoUser } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default async function LoginPage(props: {
    searchParams: Promise<{ message: string; success: string }>
}) {
    const searchParams = await props.searchParams
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-none shadow-lg sm:rounded-xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
                    <CardDescription>
                        Enter your email to sign in to your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid grid-cols-1 gap-3">
                        <form action={signInWithGoogle}>
                            <Button variant="outline" className="w-full" type="submit">
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Sign in with Google
                            </Button>
                        </form>
                        <form action={signInAsDemoUser}>
                            <Button variant="secondary" className="w-full" type="submit">
                                Sign in as Demo User
                            </Button>
                        </form>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <form>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput id="password" name="password" required minLength={6} />
                                <div className="flex justify-end">
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
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

                            <Button formAction={login} className="w-full">Log in</Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    <span>Don&apos;t have an account?</span>
                    <Link href="/signup" className="h-auto p-0 text-primary underline-offset-4 hover:underline">
                        Sign up
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
