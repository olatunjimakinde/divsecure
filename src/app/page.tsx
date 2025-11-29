import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Users, Calendar, MessageSquare, Check, Star, Menu } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="relative h-8 w-8">
              <Image src="/logo-icon.png" alt="DivSecure Logo" fill className="object-contain" />
            </div>
            <span className="font-semibold">
              <span className="font-bold">Div</span>secure
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
              Sign In
            </Link>
            <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-48">
          <div className="absolute inset-0 -z-10">
            <Image
              src="/hero-image.png"
              alt="Secure Community"
              fill
              className="object-cover opacity-40"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
          </div>
          <div className="container px-4 md:px-6 text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              v2.0 is now live
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mx-auto mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              Modern Management for <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Secure Communities</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Streamline visitor access, enhance security, and foster community engagement with the all-in-one platform designed for modern living.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-xl shadow-primary/20 w-full sm:w-auto" asChild>
                <Link href="/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base w-full sm:w-auto glass-panel hover:bg-background/80" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Everything you need</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Powerful tools for community managers, security guards, and residents.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<Shield className="h-10 w-10 text-primary" />}
                title="Visitor Management"
                description="Generate secure access codes, track entries in real-time, and manage visitor logs effortlessly."
              />
              <FeatureCard
                icon={<MessageSquare className="h-10 w-10 text-purple-500" />}
                title="Community Chat"
                description="Connect with neighbors through dedicated message boards and stay updated with announcements."
              />
              <FeatureCard
                icon={<Calendar className="h-10 w-10 text-emerald-500" />}
                title="Events & Activities"
                description="Organize community events, manage RSVPs, and foster a vibrant community spirit."
              />
              <FeatureCard
                icon={<Users className="h-10 w-10 text-blue-500" />}
                title="Role Management"
                description="Granular permissions for Managers, Guards, and Residents to ensure secure access control."
              />
              <FeatureCard
                icon={<Star className="h-10 w-10 text-amber-500" />}
                title="Premium Experience"
                description="A beautiful, mobile-first interface that works seamlessly on any device."
              />
              <FeatureCard
                icon={<Check className="h-10 w-10 text-rose-500" />}
                title="Secure & Reliable"
                description="Enterprise-grade security with encrypted data and reliable uptime you can trust."
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 overflow-hidden">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-12 text-center">Loved by Communities</h2>
            <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory -mx-4 px-4 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0">
              <TestimonialCard
                quote="Divsecure transformed how we manage visitors. It's so easy to use, even for our older residents."
                author="Sarah J."
                role="Community Manager"
              />
              <TestimonialCard
                quote="The security team loves the tablet interface. Verifying codes is instant and error-free."
                author="Mike T."
                role="Head of Security"
              />
              <TestimonialCard
                quote="Finally, an app that looks good and actually works. The message board is a game changer."
                author="Emily R."
                role="Resident"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Simple, Transparent Pricing</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your community size.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <PricingCard
                title="Starter"
                price="₦0"
                description="For small communities"
                features={['Up to 50 Residents', '2 Security Guards', 'Basic Visitor Logs', 'Community Chat']}
              />
              <PricingCard
                title="Pro"
                price="₦50,000"
                description="For growing estates"
                features={['Up to 500 Residents', '10 Security Guards', 'Advanced Analytics', 'Priority Support', 'Custom Branding']}
                popular
              />
              <PricingCard
                title="Enterprise"
                price="₦200,000"
                description="For large complexes"
                features={['Unlimited Residents', 'Unlimited Guards', 'Dedicated Account Manager', 'SLA', 'API Access']}
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-primary/5" />
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Ready to upgrade your community?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Join thousands of secure communities using Divsecure today.
            </p>
            <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-xl shadow-primary/20" asChild>
              <Link href="/signup">Get Started Now</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/20">
        <div className="container px-4 md:px-6 grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="relative h-8 w-8">
                <Image src="/logo-icon.png" alt="DivSecure Logo" fill className="object-contain" />
              </div>
              <span className="font-semibold">
                <span className="font-bold">Div</span>secure
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Making communities safer and more connected, one tap at a time.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Features</Link></li>
              <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="#" className="hover:text-foreground">Security</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">About</Link></li>
              <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
              <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="container px-4 md:px-6 mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          © 2024 Divsecure Inc. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform duration-300">
      <div className="mb-4 p-3 bg-background rounded-xl w-fit shadow-sm border border-border/50">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl min-w-[85vw] md:min-w-0 snap-center">
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
        ))}
      </div>
      <p className="text-lg font-medium mb-6">"{quote}"</p>
      <div>
        <div className="font-bold">{author}</div>
        <div className="text-sm text-muted-foreground">{role}</div>
      </div>
    </div>
  )
}

function PricingCard({ title, price, description, features, popular }: { title: string, price: string, description: string, features: string[], popular?: boolean }) {
  return (
    <div className={`glass-card p-8 rounded-3xl relative ${popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium shadow-lg">
          Most Popular
        </div>
      )}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-4xl font-extrabold">{price}</span>
        <span className="text-muted-foreground">/month</span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      <Button className={`w-full mb-8 rounded-full ${popular ? 'shadow-lg shadow-primary/20' : ''}`} variant={popular ? 'default' : 'outline'} asChild>
        <Link href="/signup">Choose Plan</Link>
      </Button>
      <ul className="space-y-3 text-sm">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
