import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { subscribeToPlan } from './actions'

const plans = [
    {
        id: 'starter',
        name: 'Starter',
        price: '$29',
        description: 'Perfect for small communities.',
        features: ['Up to 50 Households', 'Basic Visitor Logs', 'Community Announcements']
    },
    {
        id: 'growth',
        name: 'Growth',
        price: '$79',
        description: 'For growing communities.',
        features: ['Up to 200 Households', 'Advanced Visitor Logs', 'Billing & Payments', 'Priority Support']
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '$199',
        description: 'For large estates and complexes.',
        features: ['Unlimited Households', 'Custom Branding', 'API Access', 'Dedicated Account Manager']
    }
]

export default async function SubscribePage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="container mx-auto py-20 px-4">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Choose Your Plan</h1>
                <p className="text-xl text-muted-foreground">
                    Unlock the full potential of your community management.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map((plan) => (
                    <Card key={plan.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-4xl font-bold mb-6">
                                {plan.price}<span className="text-base font-normal text-muted-foreground">/month</span>
                            </div>
                            <ul className="space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center">
                                        <Check className="h-4 w-4 mr-2 text-primary" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <form action={async (formData) => {
                                'use server'
                                await subscribeToPlan(formData)
                            }} className="w-full">
                                <input type="hidden" name="planId" value={plan.id} />
                                <Button className="w-full" size="lg">
                                    Subscribe to {plan.name}
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
