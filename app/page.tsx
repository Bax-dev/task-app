import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Zap, Users, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Navigation */}
      <nav className="border-b border-border backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">TaskFlow</div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Log in
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div>
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
                ✨ Manage Projects Better
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
                Streamline Your<br className="hidden md:block" />
                <span className="text-primary">Project Management</span>
              </h1>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              TaskFlow helps teams collaborate, track progress, and deliver projects on time. Organize your work, assign tasks, and stay focused on what matters.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start For Free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4">
              <CheckCircle className="w-5 h-5 text-accent" />
              <span>No credit card required</span>
            </div>
          </div>

          {/* Right Visual */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <div className="relative bg-card border border-border rounded-3xl p-8 shadow-xl">
                <div className="space-y-4">
                  <div className="h-3 bg-muted rounded-full w-32" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-primary" />
                        <div className="h-2 bg-muted rounded-full flex-1" />
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-8 w-8 rounded-lg bg-primary/10" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for modern teams
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Blazing-fast performance keeps your team productive
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Collaboration</h3>
            <p className="text-sm text-muted-foreground">
              Work together seamlessly with your team members
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Insights</h3>
            <p className="text-sm text-muted-foreground">
              Track progress and get actionable insights
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Simple Setup</h3>
            <p className="text-sm text-muted-foreground">
              Get started in minutes without complex setup
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-primary/90 to-primary rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using TaskFlow to manage their projects efficiently.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-2xl font-bold text-primary">TaskFlow</div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 TaskFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
