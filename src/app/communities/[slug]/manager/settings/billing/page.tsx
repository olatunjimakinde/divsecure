import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { subscribeToPlan } from '@/app/subscribe/actions'

export default async function BillingPage({ params }: { params: Promise<{ slug: string }> }) {
    const supabase = await createClient()
    const { slug } = await params

    const { data: community } = await supabase
        .from('communities')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!community) notFound()

    // Check if user is manager
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .single()

    if (member?.role !== 'community_manager') {
        redirect(`/communities/${slug}`)
    }

    const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

    const { data: currentSub } = await supabase
        .from('community_subscription_settings')
        .select('*, plan:subscription_plans(*)')
        .eq('community_id', community.id)
        .single()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Subscription & Billing</h2>
                <p className="text-muted-foreground">Manage your community's subscription plan.</p>
            </div>

            {currentSub && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Current Plan: {currentSub.plan?.name || 'Unknown'}</CardTitle>
                        <CardDescription>
                            Status: <span className="capitalize font-medium text-foreground">{currentSub.status}</span>
                            {currentSub.current_period_end && (
                                <span> • Expires: {new Date(currentSub.current_period_end).toLocaleDateString()}</span>
                            )}
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                {plans?.map((plan) => {
                    const features = (plan.features as any) || {}
                    const featureList = []
                    if (features.max_residents === -1) featureList.push('Unlimited Residents')
                    else featureList.push(`Up to ${features.max_residents} Residents`)

                    if (features.max_guards === -1) featureList.push('Unlimited Guards')
                    else featureList.push(`${features.max_guards} Security Guards`)

                    if (features.priority_support) featureList.push('Priority Support')
                    if (features.dedicated_support) featureList.push('Dedicated Account Manager')

                    if (plan.name === 'Free') {
                        featureList.push('Basic Visitor Logs', 'Community Chat')
                    } else if (plan.name === 'Pro') {
                        featureList.push('Advanced Analytics', 'Billing & Payments')
                    } else if (plan.name === 'Enterprise') {
                        featureList.push('Custom Branding', 'API Access')
                    }

                    const isCurrentPlan = currentSub?.plan_id === plan.id

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
                                    <input type="hidden" name="communityId" value={community.id} />
                                    <Button
                                        className={`w-full ${plan.is_popular ? 'shadow-lg shadow-primary/20' : ''}`}
                                        size="lg"
                                        variant={isCurrentPlan ? 'secondary' : plan.is_popular ? 'default' : 'outline'}
                                        disabled={isCurrentPlan}
                                    >
                                        {isCurrentPlan ? 'Current Plan' : `Subscribe to ${plan.name}`}
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
