'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updatePlan } from '@/lib/plans'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
    id: string
    name: string
    price: number
    features: any
    is_popular: boolean
}

export function EditPlanDialog({ plan }: { plan: Plan }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(plan.name)
    const [price, setPrice] = useState(plan.price)
    const [features, setFeatures] = useState(JSON.stringify(plan.features, null, 2))
    const [isPopular, setIsPopular] = useState(plan.is_popular)

    const handleUpdate = async () => {
        setLoading(true)
        try {
            let parsedFeatures
            try {
                parsedFeatures = JSON.parse(features)
            } catch (e) {
                toast.error('Invalid JSON for features')
                setLoading(false)
                return
            }

            await updatePlan(plan.id, {
                name,
                price: Number(price),
                features: parsedFeatures,
                is_popular: isPopular,
            })
            toast.success('Plan updated successfully')
            setOpen(false)
        } catch (error) {
            toast.error('Failed to update plan')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Plan</DialogTitle>
                    <DialogDescription>
                        Update the plan details. Changes reflect immediately.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                            Price (₦)
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="isPopular" className="text-right">
                            Popular
                        </Label>
                        <div className="flex items-center space-x-2 col-span-3">
                            <input
                                type="checkbox"
                                id="isPopular"
                                checked={isPopular}
                                onChange={(e) => setIsPopular(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="isPopular" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Mark as Most Popular
                            </label>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="features" className="text-right pt-2">
                            Features (JSON)
                        </Label>
                        <Textarea
                            id="features"
                            value={features}
                            onChange={(e) => setFeatures(e.target.value)}
                            className="col-span-3 font-mono text-xs"
                            rows={8}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleUpdate} disabled={loading}>
                        {loading ? 'Updating...' : 'Save changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
