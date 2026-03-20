'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User, Bell, Menu, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useGetMeQuery, useGetNotificationsQuery, useLogoutMutation, apiSlice } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';
import ThemeToggle from '@/components/ThemeToggle';

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  organizations: 'Organizations',
  projects: 'Projects',
  tasks: 'Tasks',
  calendar: 'Calendar',
  notes: 'Notes',
  reports: 'Reports',
  favorites: 'Quick Access',
  team: 'Team',
  settings: 'Settings',
  notifications: 'Notifications',
  'activity-logs': 'Audit Logs',
  spaces: 'Spaces',
  new: 'New',
  invite: 'Invite',
};

export default function Navbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const { data: user } = useGetMeQuery();
  const { data: notifData } = useGetNotificationsQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Still clear state even if API call fails
    }
    dispatch(apiSlice.util.resetApiState());
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const unreadCount = notifData?.unreadCount ?? 0;
  const displayName = user?.name || user?.email || 'User';
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments
    .map((seg, i) => ({
      label: BREADCRUMB_LABELS[seg] || (seg.length > 12 ? `${seg.slice(0, 8)}...` : seg),
      href: '/' + segments.slice(0, i + 1).join('/'),
      isLast: i === segments.length - 1,
    }))
    .slice(0, 3);

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm h-12 flex items-center px-3 sm:px-4 gap-1.5 shrink-0">
      {/* Mobile menu */}
      {onMenuToggle && (
        <button onClick={onMenuToggle} className="md:hidden p-1.5 rounded-md text-muted-foreground">
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Breadcrumbs */}
      <div className="hidden sm:flex items-center gap-1 text-[13px] min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />}
            {crumb.isLast ? (
              <span className="text-foreground font-medium truncate max-w-[160px]">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-muted-foreground hover:text-foreground truncate max-w-[120px] transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </div>

      {/* Mobile page title */}
      <span className="sm:hidden text-sm font-medium text-foreground truncate">
        {breadcrumbs[breadcrumbs.length - 1]?.label}
      </span>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-0.5">
        {/* Search */}
        <button
          onClick={() => router.push('/tasks')}
          className="hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border text-muted-foreground text-xs"
        >
          <Search className="w-3 h-3" />
          Search...
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Link href="/notifications" className="relative p-1.5 rounded-md text-muted-foreground">
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          )}
        </Link>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 p-1 rounded-md">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/15 flex items-center justify-center flex-shrink-0">
                {user?.avatar ? (
                  <Image src={user.avatar} alt="" width={24} height={24} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] font-bold text-primary">{initials}</span>
                )}
              </div>
              <span className="text-xs hidden md:inline truncate max-w-[100px] text-foreground">{displayName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal py-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/15 flex items-center justify-center flex-shrink-0">
                  {user?.avatar ? (
                    <Image src={user.avatar} alt="" width={32} height={32} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-primary">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer text-[13px] py-1.5">
                <User className="mr-2 h-3.5 w-3.5" />
                Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer text-[13px] py-1.5">
                <Settings className="mr-2 h-3.5 w-3.5" />
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-[13px] py-1.5 text-muted-foreground"
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
