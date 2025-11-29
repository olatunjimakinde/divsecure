import { signInWithGoogle } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { SignupForm } from './signup-form'
import { createClient } from '@/lib/supabase/server'

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
        <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-none shadow-lg sm:rounded-xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
                    <CardDescription>
                        Join your community or create a new one.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <form action={signInWithGoogle}>
                        <Button variant="outline" className="w-full" type="submit">
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Sign up with Google
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    <SignupForm communities={communities || []} />

                    {searchParams?.message && (
                        <div className="text-destructive text-sm text-center mt-2">
                            {searchParams.message}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    <span>Already have an account?</span>
                    <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                        Log in
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
