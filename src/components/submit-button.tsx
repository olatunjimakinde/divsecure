'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { ComponentProps } from 'react'

type SubmitButtonProps = ComponentProps<typeof Button> & {
    pendingText?: string
}

export function SubmitButton({ children, pendingText, ...props }: SubmitButtonProps) {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" disabled={pending} loading={pending} {...props}>
            {pending ? pendingText || children : children}
        </Button>
    )
}
