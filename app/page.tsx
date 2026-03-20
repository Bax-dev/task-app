import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  Zap,
  Users,
  BarChart3,
  Shield,
  Globe,
  Clock,
  Layers,
} from 'lucide-react';
import AnimatedCounter from '@/components/landing/AnimatedCounter';
import FeatureTabs from '@/components/landing/FeatureTabs';
import TestimonialCarousel from '@/components/landing/TestimonialCarousel';
import LandingNav from '@/components/landing/LandingNav';

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TaskFlow',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Modern project management platform for teams to organize tasks, track progress, and collaborate in real-time.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '2400',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── Navigation ─── */}
      <LandingNav />

      {/* ─── Hero ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
              Free forever for small teams
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight">
              Ship Projects{' '}
              <span className="text-primary">Faster,</span>
              <br className="hidden md:block" />
              Together
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
              TaskFlow gives your team one place to plan work, track progress, and collaborate — so nothing falls through the cracks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  Start For Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8">
                  See Features
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> No credit card
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Unlimited projects
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> 5 team members free
              </span>
            </div>
          </div>

          {/* Hero Visual — Animated Dashboard Preview */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/10 rounded-3xl blur-3xl" />
              <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-muted-foreground">TaskFlow Dashboard</span>
                </div>
                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Tasks Done', value: '24', color: 'text-green-500' },
                      { label: 'In Progress', value: '8', color: 'text-blue-500' },
                      { label: 'Team Members', value: '12', color: 'text-purple-500' },
                    ].map((s, i) => (
                      <div key={i} className="bg-background rounded-lg p-3 border border-border/50">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Task list */}
                  <div className="space-y-2">
                    {[
                      { title: 'Design system update', tag: 'Design', dot: 'bg-purple-500' },
                      { title: 'API rate limiting', tag: 'Backend', dot: 'bg-blue-500' },
                      { title: 'User onboarding flow', tag: 'Product', dot: 'bg-green-500' },
                      { title: 'Mobile responsive fix', tag: 'Frontend', dot: 'bg-orange-500' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center gap-3 bg-background rounded-lg p-3 border border-border/50">
                        <div className={`w-2 h-2 rounded-full ${t.dot}`} />
                        <span className="text-sm text-foreground flex-1">{t.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{t.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof Stats ─── */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 2400, suffix: '+', label: 'Teams using TaskFlow' },
              { value: 150000, suffix: '+', label: 'Tasks completed' },
              { value: 99.9, suffix: '%', label: 'Uptime reliability' },
              { value: 4.9, suffix: '/5', label: 'Average rating' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-bold text-foreground">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Overview (Quick Cards) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            Why TaskFlow
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Built for how teams actually work
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Not another bloated PM tool. TaskFlow is fast, focused, and flexible enough for any workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Zap, title: 'Lightning Fast', desc: 'Sub-second page loads. No spinners, no waiting. Built on Next.js with edge performance.', color: 'bg-yellow-500/10 text-yellow-600' },
            { icon: Shield, title: 'Secure by Default', desc: 'Role-based access, JWT auth, encrypted passwords, and rate limiting out of the box.', color: 'bg-green-500/10 text-green-600' },
            { icon: Users, title: 'Team-First', desc: 'Organizations, spaces, and roles designed for real teams — not just solo users.', color: 'bg-blue-500/10 text-blue-600' },
            { icon: Globe, title: 'Access Anywhere', desc: 'Fully responsive and works on any device. Your dashboard travels with you.', color: 'bg-purple-500/10 text-purple-600' },
            { icon: BarChart3, title: 'Clear Insights', desc: 'Dashboard with task stats, activity logs, and progress tracking at a glance.', color: 'bg-orange-500/10 text-orange-600' },
            { icon: Clock, title: 'Real-Time Updates', desc: 'Notifications, status changes, and team activity — all in real-time.', color: 'bg-pink-500/10 text-pink-600' },
            { icon: Layers, title: 'Organized Hierarchy', desc: 'Org > Space > Project > Task. A structure that scales from 2 to 200 people.', color: 'bg-teal-500/10 text-teal-600' },
            { icon: CheckCircle, title: '5-Min Setup', desc: 'Create an org, invite your team, and start tracking tasks in under 5 minutes.', color: 'bg-indigo-500/10 text-indigo-600' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 hover:shadow-lg transition-all group">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${f.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Feature Deep Dive (Interactive Tabs) ─── */}
      <section id="features" className="bg-card/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Explore what TaskFlow can do
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Click through each feature to see how TaskFlow helps your team stay on track.
            </p>
          </div>
          <FeatureTabs />
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            Get Started
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Up and running in 3 steps
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Create your organization',
              desc: 'Sign up free, name your org, and you\'re in. No credit card, no trial limits, no friction.',
            },
            {
              step: '02',
              title: 'Invite your team',
              desc: 'Send email invitations with one click. Assign Admin, Member, or Guest roles to control access.',
            },
            {
              step: '03',
              title: 'Start shipping',
              desc: 'Create spaces, spin up projects, assign tasks, and watch your team\'s progress in real-time.',
            },
          ].map((s, i) => (
            <div key={i} className="relative text-center p-8">
              <div className="text-7xl font-black text-primary/10 mb-4">{s.step}</div>
              <h3 className="text-xl font-bold text-foreground mb-3">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
              {i < 2 && (
                <div className="hidden md:block absolute top-16 -right-4 w-8">
                  <ArrowRight className="w-8 h-8 text-primary/20" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="bg-card/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Loved by teams everywhere
            </h2>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground">No surprises. No hidden fees.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: 'Free',
              price: '$0',
              period: 'forever',
              desc: 'Perfect for small teams getting started.',
              features: ['Up to 5 team members', 'Unlimited projects', 'Task management', 'Activity logs', 'Email notifications'],
              cta: 'Get Started Free',
              popular: false,
            },
            {
              name: 'Pro',
              price: '$12',
              period: '/user/month',
              desc: 'For growing teams that need more power.',
              features: ['Unlimited team members', 'Everything in Free', 'File attachments', 'Priority support', 'Advanced roles & permissions', 'Custom fields (coming soon)'],
              cta: 'Start Pro Trial',
              popular: true,
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              period: '',
              desc: 'For large organizations with custom needs.',
              features: ['Everything in Pro', 'SSO / SAML authentication', 'Audit logs', 'Dedicated support', 'Custom integrations', 'SLA guarantees'],
              cta: 'Contact Sales',
              popular: false,
            },
          ].map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-card border-2 border-primary shadow-xl shadow-primary/10 scale-[1.02]'
                  : 'bg-card border border-border'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
              Ready to ship faster?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto text-lg">
              Join thousands of teams already using TaskFlow. Set up in 5 minutes, free forever for small teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="text-base px-8">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'var(--font-raleway)' }}>
                <span className="text-foreground">Task</span><span className="text-primary">Flow</span>
              </Link>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Modern project management for teams that ship.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                </li>
                <li>
                  <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                </li>
                <li>
                  <Link href="/user-manual" className="text-sm text-muted-foreground hover:text-foreground transition-colors">User Manual</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm">Get Started</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Up</Link>
                </li>
                <li>
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log In</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} TaskFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
