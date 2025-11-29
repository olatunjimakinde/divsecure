import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Link href="/" className="mb-8 flex flex-col items-center gap-2">
                <div className="relative h-16 w-16">
                    <Image src="/logo-icon.png" alt="DivSecure Logo" fill className="object-contain" />
                </div>
                <span className="text-2xl tracking-tight text-primary">
                    <span className="font-bold">Div</span>secure
                </span>
            </Link>
            <div className="w-full max-w-md">{children}</div>
        </div>
    )
}
