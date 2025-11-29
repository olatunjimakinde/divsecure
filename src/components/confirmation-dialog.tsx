'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ReactNode, useState } from 'react'

interface ConfirmationDialogProps {
    trigger: ReactNode
    title?: string
    description?: string
    actionLabel?: string
    onConfirm: (formData?: FormData) => void | Promise<void>
    variant?: 'default' | 'destructive'
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ConfirmationDialog({
    trigger,
    title = 'Are you sure?',
    description = 'This action cannot be undone.',
    actionLabel = 'Continue',
    onConfirm,
    variant = 'default',
    open,
    onOpenChange
}: ConfirmationDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)

    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen
    const setIsOpen = isControlled ? onOpenChange! : setInternalOpen

    const handleConfirm = async () => {
        await onConfirm()
        setIsOpen(false)
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                {trigger}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleConfirm()
                        }}
                        className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                    >
                        {actionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
