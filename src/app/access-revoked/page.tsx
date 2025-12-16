import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function AccessRevokedPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
                    <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Access Revoked
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Your access to this platform has been removed by the community administrator.
                    </p>
                </div>
                <div className="mt-8 space-y-4">
                    <p className="text-sm text-gray-500">
                        If you believe this is a mistake, please contact your community manager directly.
                    </p>
                    <Link
                        href="/auth/signout"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
