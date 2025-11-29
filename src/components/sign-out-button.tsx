'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SignOutButton({ className }: { className?: string }) {
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <Button
            variant="ghost"
            className={`w-full justify-start text-muted-foreground hover:text-foreground ${className}`}
            onClick={handleSignOut}
        >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
        </Button>
    )
}
