import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getURL } from '@/lib/utils'

export default function ForgotPasswordPage() {
    async function resetPassword(formData: FormData) {
        'use server'
        const email = formData.get('email') as string
        const supabase = await createClient()

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${getURL()}auth/callback?next=/reset-password`,
        })

        if (error) {
            redirect('/forgot-password?message=Could not send reset email')
        }

        redirect('/forgot-password?success=Check your email for a reset link')
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-none shadow-lg sm:rounded-xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Forgot password</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={resetPassword}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                            </div>
                            <Button className="w-full">Send Reset Link</Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    <Link href="/login" className="h-auto p-0 text-primary underline-offset-4 hover:underline">
                        Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
