import { UpdatePasswordForm } from './password-form'
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

            <UpdatePasswordForm error={searchParams?.error} />
        </div>
    )
}
