import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <Button variant="ghost" size="sm" asChild className="mr-4">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                    <div className="font-bold">Divsecure Privacy Policy</div>
                </div>
            </header>
            <main className="container max-w-3xl py-12">
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6">
                    <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                        <p>
                            Welcome to Divsecure ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our community management platform and services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                        <p>We collect information that you provide directly to us, including:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Personal Information:</strong> Name, email address, phone number, and unit number when you register for an account.</li>
                            <li><strong>Community Data:</strong> Information about your community, visitors, and security logs.</li>
                            <li><strong>Usage Data:</strong> Information about how you use our platform, including access times and features used.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide, maintain, and improve our services.</li>
                            <li>Process transactions and manage your account.</li>
                            <li>Send you technical notices, updates, security alerts, and support messages.</li>
                            <li>Respond to your comments, questions, and requests.</li>
                            <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at:
                            <br />
                            <a href="mailto:support@divsecure.com" className="text-primary hover:underline">support@divsecure.com</a>
                        </p>
                    </section>
                </div>
            </main>
        </div>
    )
}
