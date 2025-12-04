'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldBan, ArrowLeft, Home } from 'lucide-react'
import { motion } from 'framer-motion'

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative mb-8"
            >
                <div className="absolute inset-0 animate-pulse rounded-full bg-destructive/10 blur-3xl" />
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-muted shadow-xl ring-1 ring-border">
                    <ShieldBan className="h-16 w-16 text-destructive" />
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Gate Closed
                </h1>
                <p className="mb-8 text-lg text-muted-foreground">
                    The page you are looking for does not exist or you do not have access.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button asChild variant="outline" size="lg" className="gap-2 rounded-xl h-12">
                        <Link href="javascript:history.back()">
                            <ArrowLeft className="h-4 w-4" />
                            Go Back
                        </Link>
                    </Button>
                    <Button asChild size="lg" className="gap-2 rounded-xl h-12">
                        <Link href="/dashboard">
                            <Home className="h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
