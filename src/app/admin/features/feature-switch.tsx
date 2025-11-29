'use client'

import { Switch } from '@/components/ui/switch'
import { useTransition } from 'react'

interface FeatureSwitchProps {
    featureKey: string
    enabled: boolean
    onToggle: (key: string, enabled: boolean) => Promise<any>
}

export function FeatureSwitch({ featureKey, enabled, onToggle }: FeatureSwitchProps) {
    const [isPending, startTransition] = useTransition()

    return (
        <Switch
            checked={enabled}
            disabled={isPending}
            onChange={(e) => {
                const checked = e.target.checked
                startTransition(async () => {
                    await onToggle(featureKey, checked)
                })
            }}
        />
    )
}
