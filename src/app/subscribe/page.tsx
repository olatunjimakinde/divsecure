import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { subscribeToPlan } from './actions'

export const dynamic = 'force-dynamic'

export default async function SubscribePage(props: {
    searchParams: Promise<{ intent?: string; community_id?: string }>
}) {
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

    return (
        <div className="container mx-auto py-20 px-4">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Choose Your Plan</h1>
                <p className="text-xl text-muted-foreground">
                    Unlock the full potential of your community management.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans?.map((plan) => {
                    const features = (plan.features as any) || {}
                    const featureList = []
                    if (features.max_residents === -1) featureList.push('Unlimited Residents')
                    else featureList.push(`Up to ${features.max_residents} Residents`)

                    if (features.max_guards === -1) featureList.push('Unlimited Guards')
                    else featureList.push(`${features.max_guards} Security Guards`)

                    if (features.priority_support) featureList.push('Priority Support')
                    if (features.dedicated_support) featureList.push('Dedicated Account Manager')

                    // Add generic features based on plan name for visual consistency
                    if (plan.name === 'Free') {
                        featureList.push('Basic Visitor Logs', 'Community Chat')
                    } else if (plan.name === 'Pro') {
                        featureList.push('Advanced Analytics', 'Billing & Payments')
                    } else if (plan.name === 'Enterprise') {
                        featureList.push('Custom Branding', 'API Access')
                    }

                    return (
                        <Card key={plan.id} className={`flex flex-col relative ${plan.is_popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                            {plan.is_popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                                    Most Popular
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription>
                                    {plan.name === 'Free' ? 'Perfect for small communities.' : plan.name === 'Pro' ? 'For growing communities.' : 'For large estates and complexes.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-4xl font-bold mb-6">
                                    ₦{plan.price.toLocaleString()}<span className="text-base font-normal text-muted-foreground">/month</span>
                                </div>
                                <ul className="space-y-3">
                                    {featureList.map((feature, i) => (
                                        <li key={i} className="flex items-center">
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
                                    <input type="hidden" name="communityId" value={searchParams.community_id || ''} />
                                    <input type="hidden" name="intent" value={searchParams.intent || ''} />
                                    <Button className={`w-full ${plan.is_popular ? 'shadow-lg shadow-primary/20' : ''}`} size="lg" variant={plan.is_popular ? 'default' : 'outline'}>
                                        Subscribe to {plan.name}
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    )
                })}
                {!plans?.length && (
                    <div className="col-span-3 text-center text-muted-foreground">
                        No pricing plans available.
                    </div>
                )}
            </div>
        </div>
    )
}
