import { CreateCommunityForm } from './create-community-form'

export default function CreateCommunityPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight">Create a Community</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Start your new community today.
                    </p>
                </div>
                <CreateCommunityForm />
            </div>
        </div>
    )
}
