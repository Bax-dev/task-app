'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetMeQuery, useLogoutMutation, apiSlice } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';
import { toast } from 'sonner';

const links = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Testimonials', href: '/#testimonials' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'User Manual', href: '/user-manual' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: user } = useGetMeQuery();
  const isLoggedIn = !!user;
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Still clear state even if API call fails
    }
    dispatch(apiSlice.util.resetApiState());
    toast.success('Logged out successfully');
    setOpen(false);
    router.push('/login');
  };

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="text-muted-foreground hover:text-foreground p-1"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg z-50">
          <div className="flex flex-col p-4 gap-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-border" />
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium text-foreground py-2">
                  Dashboard
                </Link>
                <Button size="sm" variant="outline" className="w-full" onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-foreground py-2">
                  Log in
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)}>
                  <Button size="sm" className="w-full">Get Started Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
