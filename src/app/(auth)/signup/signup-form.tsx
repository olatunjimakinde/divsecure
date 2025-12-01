'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { PasswordStrengthIndicator } from '@/components/ui/password-strength'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { signup } from '../actions'

type Community = {
    id: string
    name: string
}

export function SignupForm({ communities }: { communities: Community[] }) {
    const [role, setRole] = useState<'household' | 'manager'>('household')
    const [communityName, setCommunityName] = useState('')
    const [communitySlug, setCommunitySlug] = useState('')
    const [isSlugEdited, setIsSlugEdited] = useState(false)
    const [password, setPassword] = useState('')
    const [phone, setPhone] = useState('')

    // Combobox state
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value
        setCommunityName(name)
        if (!isSlugEdited) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            setCommunitySlug(slug)
        }
    }

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCommunitySlug(e.target.value)
        setIsSlugEdited(true)
    }

    return (
        <div className="grid gap-4">
            <Tabs defaultValue="household" onValueChange={(v) => setRole(v as 'household' | 'manager')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="household">Household</TabsTrigger>
                    <TabsTrigger value="manager">Manager</TabsTrigger>
                </TabsList>

                <form action={signup} className="mt-4 space-y-4">
                    <input type="hidden" name="role" value={role} />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <PasswordStrengthIndicator password={password} />
                    </div>

                    {role === 'household' && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="community">Community</Label>
                                <input type="hidden" name="communityId" value={value} />
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-full justify-between"
                                        >
                                            {value
                                                ? communities.find((c) => c.id === value)?.name
                                                : "Select..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search community..." />
                                            <CommandList>
                                                <CommandEmpty>No community found.</CommandEmpty>
                                                <CommandGroup>
                                                    {communities.map((c) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={c.name}
                                                            onSelect={() => {
                                                                setValue(c.id)
                                                                setOpen(false)
                                                            }}
                                                            onMouseDown={(e) => {
                                                                // Prevent focus loss which closes popover before selection
                                                                e.preventDefault()
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    value === c.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {c.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="unitNumber">Unit Number</Label>
                                <Input id="unitNumber" name="unitNumber" placeholder="Apt 4B" required />
                            </div>
                        </>
                    )}

                    {role === 'manager' && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            <p>You will be able to create your community after subscribing.</p>
                        </div>
                    )}

                    <SubmitButton />
                </form>
            </Tabs>
        </div>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating Account...' : 'Create Account'}
        </Button>
    )
}
