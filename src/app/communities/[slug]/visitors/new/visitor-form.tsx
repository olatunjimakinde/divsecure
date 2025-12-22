'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { createVisitorCode } from '../../../visitors/actions'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

interface VisitorFormProps {
    communityId: string
    communitySlug: string
}

export function VisitorForm({ communityId, communitySlug }: VisitorFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    // Default valid until 24 hours from now
    const now = new Date()
    // Adjust to local ISO string for input (remove seconds/ms)
    // We need "YYYY-MM-DDTHH:mm"
    const toLocalISO = (date: Date) => {
        const offsetMs = date.getTimezoneOffset() * 60 * 1000
        const localDate = new Date(date.getTime() - offsetMs)
        return localDate.toISOString().slice(0, 16)
    }

    const [validFrom, setValidFrom] = useState(toLocalISO(now))
    const [validUntil, setValidUntil] = useState(toLocalISO(new Date(now.getTime() + 24 * 60 * 60 * 1000)))

    const [isOneTime, setIsOneTime] = useState(true)

    const [codeType, setCodeType] = useState('visitor')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)

        // Convert local time inputs to UTC ISO strings
        const fromDate = new Date(validFrom)
        const untilDate = new Date(validUntil)

        formData.set('validFrom', fromDate.toISOString())
        formData.set('validUntil', untilDate.toISOString())

        try {
            await createVisitorCode(formData)
        } catch (error) {
            console.error('Error submitting form:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>New Visitor</CardTitle>
                <CardDescription>
                    Create a temporary access code for your guest.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <input type="hidden" name="communityId" value={communityId} />
                <input type="hidden" name="communitySlug" value={communitySlug} />

                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="visitorName">Visitor Name</Label>
                        <Input id="visitorName" name="visitorName" placeholder="John Doe" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="codeType">Visitor Type</Label>
                        <Select name="codeType" value={codeType} onValueChange={(val) => {
                            setCodeType(val)
                            // Auto-configure for common use cases
                            if (val === 'service_provider') {
                                setIsOneTime(false)
                            } else {
                                setIsOneTime(true)
                            }
                        }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="visitor">Guest / Visitor</SelectItem>
                                <SelectItem value="service_provider">Service Provider / Staff (Clock In/Out)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            {codeType === 'service_provider'
                                ? 'Enables Clock In/Out tracking for staff.'
                                : 'Standard entry code for guests.'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vehiclePlate">Vehicle Plate Number (Optional)</Label>
                        <Input id="vehiclePlate" name="vehiclePlate" placeholder="ABC-123" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="validFrom">Valid From</Label>
                            <Input
                                id="validFrom"
                                name="validFrom"
                                type="datetime-local"
                                value={validFrom}
                                onChange={(e) => setValidFrom(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="validUntil">Valid Until</Label>
                            <Input
                                id="validUntil"
                                name="validUntil"
                                type="datetime-local"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isOneTime"
                            name="isOneTime"
                            checked={isOneTime}
                            onCheckedChange={(checked) => setIsOneTime(checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="isOneTime" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                One-time use only
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Code will expire immediately after first use.
                            </p>
                        </div>
                    </div>

                    {!isOneTime && (
                        <div className="space-y-2">
                            <Label htmlFor="maxUses">Number of Uses (Optional)</Label>
                            <Input
                                id="maxUses"
                                name="maxUses"
                                type="number"
                                min="1"
                                placeholder="Unlimited"
                            />
                            <p className="text-sm text-muted-foreground">
                                Leave blank for unlimited uses within the valid period.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            'Generate Code'
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
