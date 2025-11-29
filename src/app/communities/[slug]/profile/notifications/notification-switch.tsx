'use client'

import { Switch } from '@/components/ui/switch'
import { updateNotificationPreference } from './actions'
import { useTransition } from 'react'

interface NotificationSwitchProps {
    communityId: string
    typeId: string
    enabled: boolean
    id?: string
}

export function NotificationSwitch({ communityId, typeId, enabled, id }: NotificationSwitchProps) {
    const [isPending, startTransition] = useTransition()

    return (
        <Switch
            id={id}
            checked={enabled}
            disabled={isPending}
            onChange={(e) => {
                const checked = e.target.checked
                startTransition(async () => {
                    await updateNotificationPreference(communityId, typeId, checked)
                })
            }}
        />
    )
}
