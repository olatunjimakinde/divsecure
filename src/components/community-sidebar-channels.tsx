'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

interface Channel {
    id: string
    slug: string
    name: string
}

interface CommunitySidebarChannelsProps {
    communitySlug: string
    channels: Channel[]
}

export function CommunitySidebarChannels({ communitySlug, channels }: CommunitySidebarChannelsProps) {
    const [isOpen, setIsOpen] = useState(true)
    const pathname = usePathname()

    if (!channels || channels.length === 0) return null

    // If only 1 channel, show it directly without collapse (per user request implication, or just keep consistent)
    // User said: "When more than 1 message board is created, It should fall under secondary menu"
    const shouldCollapse = channels.length > 1

    if (!shouldCollapse) {
        const channel = channels[0]
        const isActive = pathname === `/communities/${communitySlug}/${channel.slug}`
        return (
            <Button
                variant="ghost"
                className={cn(
                    "w-full justify-start rounded-xl px-3 py-2 h-auto font-normal transition-all",
                    isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
                asChild
            >
                <Link href={`/communities/${communitySlug}/${channel.slug}`}>
                    <Hash className="mr-2 h-4 w-4 opacity-60" />
                    {channel.name}
                </Link>
            </Button>
        )
    }

    return (
        <div className="space-y-1">
            <Button
                variant="ghost"
                className="w-full justify-between rounded-xl px-3 py-2 h-auto font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="flex items-center">
                    <span className="mr-2">Board Messages</span>
                </span>
                {isOpen ? <ChevronDown className="h-4 w-4 opacity-50" /> : <ChevronRight className="h-4 w-4 opacity-50" />}
            </Button>

            {isOpen && (
                <div className="pl-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {channels.map((channel) => {
                        const isActive = pathname === `/communities/${communitySlug}/${channel.slug}`
                        return (
                            <Button
                                key={channel.id}
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start rounded-xl px-3 py-2 h-auto font-normal transition-all text-sm",
                                    isActive
                                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                )}
                                asChild
                            >
                                <Link href={`/communities/${communitySlug}/${channel.slug}`}>
                                    <Hash className="mr-2 h-3 w-3 opacity-60" />
                                    {channel.name}
                                </Link>
                            </Button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
