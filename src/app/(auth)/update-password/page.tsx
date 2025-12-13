
import { updatePassword } from '../actions'
import { SubmitButton } from '@/components/submit-button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

export default async function UpdatePasswordPage(props: {
    searchParams: Promise<{ error: string }>
}) {
    const searchParams = await props.searchParams
    return (
        <div className="flex flex-col items-center justify-center w-full px-5 pt-10 max-w-md mx-auto min-h-screen bg-background">
            <div className="flex flex-col items-center w-full mb-8">
                <Image src="/logo.png" alt="Divsecure" width={120} height={120} className="mb-6" priority />
                <h1 className="text-2xl font-bold text-foreground">Set Password</h1>
                <p className="text-muted-foreground text-sm">Please set a new password for your account</p>
            </div>

            <form action={updatePassword} className="w-full space-y-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            placeholder="Enter new password"
                            required
                            minLength={6}
                            className="h-12 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <PasswordInput
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm new password"
                            required
                            minLength={6}
                            className="h-12 rounded-xl"
                        />
                    </div>
                </div>

                {searchParams?.error && (
                    <div className="text-destructive text-sm text-center">
                        {searchParams.error}
                    </div>
                )}

                <SubmitButton className="w-full h-12 rounded-xl mt-6">
                    Update Password
                </SubmitButton>
            </form>
        </div>
    )
}
