'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useGetMeQuery, useLogoutMutation } from '@/store/api';
import { toast } from 'sonner';
import MobileNav from './MobileNav';

export default function LandingNav() {
  const router = useRouter();
  const { data: user } = useGetMeQuery();
  const isLoggedIn = !!user;
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'var(--font-raleway)' }}>
            <span className="text-foreground">Task</span><span className="text-primary">Flow</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="/#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </a>
            <a href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <Link href="/user-manual" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              User Manual
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="hidden sm:inline-block">
                <Button size="sm">Dashboard</Button>
              </Link>
              <Button size="sm" variant="outline" className="hidden sm:inline-flex" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </>
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
