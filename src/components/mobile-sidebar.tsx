"use client"

import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

interface MobileSidebarProps {
    children?: React.ReactNode
    className?: string
}

export function MobileSidebar({ children, className }: MobileSidebarProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                    <div className="flex h-14 items-center border-b px-6 lg:h-[60px]">
                        <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => setOpen(false)}>
                            <div className="relative h-10 w-10">
                                <Image src="/logo.png" alt="DivSecure Logo" fill className="object-contain" />
                            </div>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto py-4" onClick={(e) => {
                        // Close sidebar when a link is clicked
                        if ((e.target as HTMLElement).closest('a')) {
                            setOpen(false)
                        }
                    }}>
                        {children}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
