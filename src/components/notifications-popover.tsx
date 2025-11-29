'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { markNotificationAsRead, markAllNotificationsAsRead } from '../app/notifications/actions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Notification {
    id: string
    type: string
    message: string
    read: boolean
    created_at: string
}

export function NotificationsPopover({ notifications }: { notifications: Notification[] }) {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const unreadCount = notifications.filter(n => !n.read).length

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id)
        router.refresh()
    }

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead()
        router.refresh()
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-primary" onClick={handleMarkAllAsRead}>
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <div className="grid">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-4 p-4 transition-colors hover:bg-muted/50",
                                        !notification.read && "bg-muted/20"
                                    )}
                                >
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-sm leading-none", !notification.read && "font-medium")}>
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                                            onClick={() => handleMarkAsRead(notification.id)}
                                        >
                                            <Check className="h-3 w-3" />
                                            <span className="sr-only">Mark as read</span>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
