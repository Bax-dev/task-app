'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useGetMeQuery } from '@/store/api';
import MobileNav from './MobileNav';

export default function LandingNav() {
  const { data: user } = useGetMeQuery();
  const isLoggedIn = !!user;

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-primary">
            TaskFlow
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link href="/dashboard" className="hidden sm:inline-block">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline text-foreground hover:text-primary transition-colors font-medium text-sm">
                Log in
              </Link>
              <Link href="/signup" className="hidden sm:inline-block">
                <Button size="sm">Get Started Free</Button>
              </Link>
            </>
          )}
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
