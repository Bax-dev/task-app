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
import {
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useGetMeQuery, useGetNotificationsQuery, useLogoutMutation, apiSlice } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

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
  boards: 'Boards',
  sprints: 'Sprints',
  labels: 'Labels',
  workflows: 'Workflows',
  automations: 'Automations',
  dashboards: 'Dashboards',
  'saved-filters': 'Saved Filters',
};

export default function Navbar({
  onMenuToggle,
  onDesktopToggle,
  sidebarCollapsed,
  onSearchClick,
  onAiClick,
}: {
  onMenuToggle?: () => void;
  onDesktopToggle?: () => void;
  sidebarCollapsed?: boolean;
  onSearchClick?: () => void;
  onAiClick?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const { data: user } = useGetMeQuery();
  const { data: notifData } = useGetNotificationsQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const unreadCount = notifData?.unreadCount ?? 0;
  const displayName = user?.name || user?.email || 'User';
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments
    .map((segment, index) => ({
      label: BREADCRUMB_LABELS[segment] || (segment.length > 12 ? `${segment.slice(0, 8)}...` : segment),
      href: '/' + segments.slice(0, index + 1).join('/'),
      isLast: index === segments.length - 1,
    }))
    .slice(0, 3);

  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';
  const primaryAction =
    pageTitle === 'Tasks'
      ? { label: 'New Task', href: '/tasks' }
      : pageTitle === 'Projects'
        ? { label: 'View Projects', href: '/projects' }
        : null;

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      // Clear client state even if the network request fails.
    }
    dispatch(apiSlice.util.resetApiState());
    toast.success('Logged out successfully');
    router.push('/login');
  }

  return (
    <nav className="flex min-h-16 items-center gap-3 border-b border-border bg-card/90 px-3 sm:px-4 backdrop-blur-sm">
      {onMenuToggle && (
        <button onClick={onMenuToggle} aria-label="Open navigation menu" className="rounded-md p-2 text-muted-foreground md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      )}
      {onDesktopToggle && (
        <button
          onClick={onDesktopToggle}
          className="hidden md:inline-flex rounded-md p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex min-w-0 items-center gap-1">
              {index > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />}
              {crumb.isLast ? (
                <span className="truncate font-semibold text-foreground">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="truncate hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </div>
      </div>

      {primaryAction && (
        <Link href={primaryAction.href} className="hidden lg:block">
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            {primaryAction.label}
          </Button>
        </Link>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={onSearchClick}
          className="hidden h-9 items-center gap-2 rounded-xl border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:flex"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Search or jump
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono">Ctrl+K</kbd>
        </button>

        <button
          onClick={onAiClick}
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          title="TaskFlow AI"
          aria-label="Open TaskFlow AI assistant"
        >
          <Sparkles className="h-[18px] w-[18px]" />
        </button>

        <ThemeToggle />

        <Link
          href="/notifications"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          className="relative rounded-xl p-2 text-muted-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label={`Account menu for ${displayName}`} className="flex items-center gap-2 rounded-xl p-1.5">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/15">
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt=""
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-semibold text-primary">{initials}</span>
                )}
              </div>
              <span className="hidden max-w-[120px] truncate text-sm text-foreground md:inline">
                {displayName}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal py-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/15">
                  {user?.avatar ? (
                    <Image
                      src={user.avatar}
                      alt=""
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-semibold text-primary">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer" disabled={isLoggingOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
