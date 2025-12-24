import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import {
  ArrowRight,
  Shield,
  Users,
  Calendar,
  MessageSquare,
  Check,
  Star,
  Menu,
  Smartphone,
  Lock,
  Zap
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  let plans = null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })
    plans = data
  } catch (e) {
    console.error('LandingPage Error:', e)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg shadow-primary/20">
              <Image src="/logo-icon.png" alt="DivSecure Logo" fill className="object-cover p-1" />
            </div>
            <span className="font-semibold text-foreground">
              <span className="text-primary">Div</span>Secure
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link>
            <Link href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors">Testimonials</Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block">
              Sign In
            </Link>
            <Button asChild className="rounded-full px-6 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white border-0">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-36 md:pb-48">
          {/* Abstract Background */}
          <div className="absolute inset-0 -z-10 bg-gradient-soft opacity-70" />
          <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse" />
          <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] opacity-30" />

          <div className="container px-4 md:px-6 text-center z-10 relative">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-white/50 dark:bg-white/5 px-4 py-1.5 text-sm font-medium text-primary mb-8 backdrop-blur-sm animate-fade-in-up">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              The new standard in community safety
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl max-w-5xl mx-auto mb-8 animate-fade-in-up text-balance" style={{ animationDelay: '0.1s' }}>
              Modern Management for <br className="hidden sm:block" />
              <span className="text-gradient">Secure Communities</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in-up text-balance leading-relaxed" style={{ animationDelay: '0.2s' }}>
              Streamline visitor access, enhance security, and foster vibrant community engagement.
              The all-in-one platform designed for modern living.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Button size="lg" className="rounded-full px-8 h-14 text-base shadow-xl shadow-primary/25 bg-primary hover:bg-primary/90 text-white w-full sm:w-auto transition-all hover:scale-105" asChild>
                <Link href="/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-base w-full sm:w-auto glass-panel hover:bg-white/80 dark:hover:bg-white/10 border-white/20 dark:border-white/10 transition-all hover:scale-105" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>

            {/* Hero Float UI Mockup */}
            <div className="mt-20 mx-auto max-w-5xl glass-panel rounded-3xl p-2 md:p-4 shadow-2xl animate-fade-in-up transform transition-transform duration-700 hover:rotate-x-2" style={{ animationDelay: '0.5s', perspective: '1000px' }}>
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-background border border-border/50">
                {/* Placeholder for actual dashboard screenshot */}
                <div className="absolute inset-0 bg-gradient-to-br from-background to-muted flex items-center justify-center text-muted-foreground/20">
                  <div className="text-center">
                    <Smartphone className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-semibold">Dashboard UI Preview</p>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-4 left-4 right-4 h-12 glass-panel rounded-xl flex items-center px-4 justify-between">
                  <div className="w-20 h-3 bg-muted-foreground/10 rounded-full" />
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-20">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">
                Everything you need, <br />
                <span className="text-muted-foreground">in one beautiful app.</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Powerful tools for community managers, security guards, and residents.
                Designed for speed, clarity, and ease of use.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Shield className="h-6 w-6 text-primary" />}
                title="Visitor Management"
                description="Generate secure access codes, track entries in real-time, and manage visitor logs effortlessly."
                delay={0}
              />
              <FeatureCard
                icon={<MessageSquare className="h-6 w-6 text-indigo-500" />}
                title="Community Chat"
                description="Connect with neighbors through dedicated message boards. Secure channels for announcements and discussions."
                delay={0.1}
              />
              <FeatureCard
                icon={<Calendar className="h-6 w-6 text-emerald-500" />}
                title="Events & Activities"
                description="Organize community events, manage RSVPs, and foster a vibrant community spirit with ease."
                delay={0.2}
              />
              <FeatureCard
                icon={<Lock className="h-6 w-6 text-rose-500" />}
                title="Smart Role Access"
                description="Granular permissions for Managers, Guards, and Residents. Everyone sees exactly what they need."
                delay={0.3}
              />
              <FeatureCard
                icon={<Smartphone className="h-6 w-6 text-amber-500" />}
                title="Mobile First"
                description="Native-app feel with gestures, bottom sheets, and optimized touch targets for on-the-go management."
                delay={0.4}
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6 text-blue-500" />}
                title="Instant Verification"
                description="Fast code validation for guards. <1s response time ensures no queues at the gate."
                delay={0.5}
              />
            </div>
          </div>
        </section>

        {/* Testimonials - Auto Scroll */}
        <section id="testimonials" className="py-24 bg-muted/30 border-y border-border/50 overflow-hidden relative">
          <div className="container px-4 md:px-6 mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Loved by Communities</h2>
          </div>

          <div className="relative w-full">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

            <div className="flex gap-6 animate-scroll hover:pause px-4 w-max">
              {/* Tripled for infinite loop illusion */}
              {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                <GlassCard key={i} className="w-[350px] md:w-[400px] flex-shrink-0" hoverEffect={true}>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-lg font-medium mb-6 leading-normal">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center font-bold text-primary">
                      {t.author[0]}
                    </div>
                    <div>
                      <div className="font-bold">{t.author}</div>
                      <div className="text-sm text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 relative">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-20">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Simple, Transparent Pricing</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Choose the perfect plan for your community size. No hidden fees.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto items-center">
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
                  featureList.push('Advanced Analytics', 'Custom Branding')
                } else if (plan.name === 'Enterprise') {
                  featureList.push('SLA', 'API Access')
                }

                return (
                  <PricingCard
                    key={plan.id}
                    title={plan.name}
                    price={`₦${plan.price.toLocaleString()}`}
                    description={plan.name === 'Free' ? 'For small communities' : plan.name === 'Pro' ? 'For growing estates' : 'For large complexes'}
                    features={featureList}
                    popular={plan.is_popular}
                    accentColor={plan.name === 'Pro' ? 'text-primary' : undefined}
                  />
                )
              })}
              {!plans?.length && (
                <div className="col-span-3 text-center p-12 glass-panel rounded-2xl">
                  <p className="text-muted-foreground">Pricing plans are currently being updated.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-primary/5" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background to-transparent" />

          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto glass-panel p-12 rounded-3xl border-primary/10 shadow-2xl relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10" />

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Ready to upgrade your community?</h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Join thousands of secure communities using Divsecure today.
                Experience the future of residential management.
              </p>
              <Button size="lg" className="rounded-full px-10 h-14 text-lg shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white" asChild>
                <Link href="/signup">Get Started Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/10 bg-muted/10 py-16">
        <div className="container px-4 md:px-6 grid gap-12 md:grid-cols-4">
          <div className="space-y-6">
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-gradient-to-br from-primary to-indigo-600">
                <Image src="/logo-icon.png" alt="DivSecure Logo" fill className="object-cover p-1" />
              </div>
              <span className="font-semibold">
                <span className="text-primary">Div</span>Secure
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Making communities safer, smarter, and more connected.
              Built with ❤️ for modern living.
            </p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                <span className="sr-only">Twitter</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </div>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                <span className="sr-only">GitHub</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-6">Product</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Roadmap</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-6">Company</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-6">Legal</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="container px-4 md:px-6 mt-16 pt-8 border-t border-border/10 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Divsecure Inc. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, delay = 0 }: { icon: React.ReactNode, title: string, description: string, delay?: number }) {
  return (
    <GlassCard className="h-full group animate-fade-in-up" style={{ animationDelay: `${delay}s` }}>
      <div className="mb-6 inline-flex p-3 bg-muted/50 rounded-xl group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </GlassCard>
  )
}

const testimonials = [
  {
    quote: "Divsecure transformed how we manage visitors. It's so easy to use, even for our older residents.",
    author: "Sarah J.",
    role: "Community Manager"
  },
  {
    quote: "The security team loves the tablet interface. Verifying codes is instant and error-free.",
    author: "Mike T.",
    role: "Head of Security"
  },
  {
    quote: "Finally, an app that looks good and actually works. The message board is a game changer.",
    author: "Emily R.",
    role: "Resident"
  }
]

function PricingCard({ title, price, description, features, popular, accentColor }: { title: string, price: string, description: string, features: string[], popular?: boolean, accentColor?: string }) {
  return (
    <GlassCard
      className={`relative h-full flex flex-col ${popular ? 'border-primary/50 shadow-2xl scale-105 z-10' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
      gradient={popular}
    >
      {popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg uppercase tracking-wide">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <h3 className={`text-2xl font-bold mb-2 ${accentColor}`}>{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <div className="flex items-baseline gap-1 mb-8">
        <span className="text-5xl font-extrabold tracking-tight">{price}</span>
        <span className="text-muted-foreground font-medium">/mo</span>
      </div>

      <Button className={`w-full mb-8 rounded-full h-12 text-base ${popular ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20' : 'bg-muted hover:bg-muted/80 text-foreground'}`} asChild>
        <Link href="/signup">{title === 'Enterprise' ? 'Contact Sales' : 'Choose Plan'}</Link>
      </Button>

      <div className="space-y-4 flex-1">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3 text-sm">
            <div className="mt-0.5 rounded-full bg-primary/10 p-1">
              <Check className="h-3 w-3 text-primary" />
            </div>
            <span className="text-muted-foreground">{feature}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
