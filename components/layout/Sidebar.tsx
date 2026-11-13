'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  FolderOpen,
  GaugeCircle,
  Kanban,
  Layers,
  LayoutDashboard,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Plug,
  Repeat2,
  Star,
  Tags,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  useCreateSpaceMutation,
  useGetMeQuery,
  useGetOrgMembersQuery,
  useGetOrganizationsQuery,
  useGetOrgSpacesQuery,
} from '@/store/api';
import { ACCENT_CLASSES, type NavAccent } from '@/lib/nav-colors';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  accent: NavAccent;
  adminOnly?: boolean;
}

const primaryNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, accent: 'indigo' },
  { name: 'My Tasks', href: '/tasks', icon: CheckSquare, accent: 'emerald' },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays, accent: 'amber' },
  { name: 'Favorites', href: '/favorites', icon: Star, accent: 'yellow' },
];

const workNav: NavItem[] = [
  { name: 'Projects', href: '/projects', icon: FolderOpen, accent: 'blue' },
  { name: 'Boards', href: '/boards', icon: Kanban, accent: 'violet' },
  { name: 'Sprints', href: '/sprints', icon: Repeat2, accent: 'rose' },
  { name: 'Notes', href: '/notes', icon: FileText, accent: 'orange' },
  { name: 'Daily Reports', href: '/daily-reports', icon: CalendarCheck, accent: 'teal' },
];

const peopleNav: NavItem[] = [
  { name: 'Organizations', href: '/organizations', icon: Building2, accent: 'sky' },
  { name: 'Members', href: '/team', icon: Users, accent: 'fuchsia' },
];

const insightsNav: NavItem[] = [
  { name: 'Reports', href: '/reports', icon: BarChart3, accent: 'cyan' },
  { name: 'Dashboards', href: '/dashboards', icon: LayoutDashboard, accent: 'indigo' },
  { name: 'Saved Filters', href: '/saved-filters', icon: Filter, accent: 'purple' },
  { name: 'Audit Logs', href: '/activity-logs', icon: Activity, accent: 'slate', adminOnly: true },
];

const configureNav: NavItem[] = [
  { name: 'Labels', href: '/labels', icon: Tags, accent: 'lime' },
  { name: 'Issue Types', href: '/issue-types', icon: Layers, accent: 'pink', adminOnly: true },
  { name: 'Workflows', href: '/workflows', icon: GaugeCircle, accent: 'blue', adminOnly: true },
  { name: 'Automations', href: '/automations', icon: Zap, accent: 'yellow', adminOnly: true },
  { name: 'Integrations', href: '/integrations', icon: Plug, accent: 'teal', adminOnly: true },
];

const SPACE_COLORS = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#db2777',
  '#7c3aed',
  '#0891b2',
  '#65a30d',
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
}

export default function Sidebar({
  onClose,
  collapsed = false,
  onToggleCollapse,
}: {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    workspace: true,
    people: true,
    insights: false,
    configure: false,
  });
  const [newSpaceOpen, setNewSpaceOpen] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [spaceColor, setSpaceColor] = useState('#2563eb');
  const [spaceDesc, setSpaceDesc] = useState('');
  const [spaceOrgId, setSpaceOrgId] = useState('');

  const { data: user } = useGetMeQuery();
  const { data: organizations = [] } = useGetOrganizationsQuery();
  const firstOrgId = organizations[0]?.id || '';
  const { data: orgMembers = [] } = useGetOrgMembersQuery(firstOrgId, { skip: !firstOrgId });
  const isAdmin = orgMembers.some((member: any) => member.id === user?.id && member.role === 'ADMIN');
  const [createSpace, { isLoading: isCreatingSpace }] = useCreateSpaceMutation();

  const filteredPrimaryNav = useMemo(() => primaryNav.filter((item) => !item.adminOnly || isAdmin), [isAdmin]);
  const filteredWorkNav = useMemo(() => workNav.filter((item) => !item.adminOnly || isAdmin), [isAdmin]);
  const filteredPeopleNav = useMemo(() => peopleNav.filter((item) => !item.adminOnly || isAdmin), [isAdmin]);
  const filteredConfigureNav = useMemo(
    () => configureNav.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );
  const filteredInsightsNav = useMemo(
    () => insightsNav.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  async function handleCreateSpace(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createSpace({
        name: spaceName,
        description: spaceDesc.trim() || undefined,
        color: spaceColor,
        organizationId: spaceOrgId,
      }).unwrap();
      toast.success('Space created');
      setNewSpaceOpen(false);
      setSpaceName('');
      setSpaceDesc('');
      setSpaceColor('#2563eb');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create space');
    }
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <aside className={`flex h-full ${collapsed ? 'w-14' : 'w-64'} flex-col overflow-hidden border-r border-border bg-card transition-[width] duration-200`}>
      <div className="flex h-14 items-center justify-between border-b border-border px-3 shrink-0">
        <Link href="/dashboard" onClick={onClose} className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shrink-0">
              <NotebookPen className="h-4 w-4" />
            </div>
            {!collapsed && (
              <p className="truncate text-sm font-semibold text-primary">TaskFlow</p>
            )}
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <nav className={`${collapsed ? 'p-2 space-y-1' : 'space-y-3 p-3'}`}>
          <div className="space-y-1">
            {filteredPrimaryNav.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                onClose={onClose}
                collapsed={collapsed}
              />
            ))}
          </div>

          <SidebarSection
            label="Work"
            expanded={expandedSections.workspace}
            onToggle={() => toggleSection('workspace')}
            collapsed={collapsed}
          >
            {filteredWorkNav.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                onClose={onClose}
                collapsed={collapsed}
              />
            ))}
          </SidebarSection>

          <SidebarSection
            label="People"
            expanded={expandedSections.people}
            onToggle={() => toggleSection('people')}
            collapsed={collapsed}
          >
            {filteredPeopleNav.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                onClose={onClose}
                collapsed={collapsed}
              />
            ))}
          </SidebarSection>

          {!collapsed && (
            <div>
              <div className="mb-1 flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Spaces</span>
                <Dialog open={newSpaceOpen} onOpenChange={setNewSpaceOpen}>
                  <DialogTrigger asChild>
                    <button
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      title="Create space"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Space</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSpace} className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Organization</Label>
                        <Select value={spaceOrgId} onValueChange={setSpaceOrgId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org: any) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Space name</Label>
                        <Input
                          value={spaceName}
                          onChange={(event) => setSpaceName(event.target.value)}
                          placeholder="e.g. Product, Growth"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={spaceDesc}
                          onChange={(event) => setSpaceDesc(event.target.value)}
                          placeholder="What kind of work belongs here?"
                          rows={3}
                          maxLength={500}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                          {SPACE_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setSpaceColor(color)}
                              aria-label={`Color ${color}`}
                              aria-pressed={spaceColor === color}
                              className={`h-7 w-7 rounded-full border-2 transition-transform ${
                                spaceColor === color ? 'scale-110 border-foreground' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isCreatingSpace || !spaceOrgId}>
                        {isCreatingSpace ? 'Creating...' : 'Create space'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-1">
                {organizations.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-muted-foreground">
                    Join an organization to see spaces.
                  </p>
                ) : (
                  organizations.map((org: any) => (
                    <OrgSpacesTree
                      key={org.id}
                      org={org}
                      expanded={expandedOrgs.has(org.id)}
                      onToggle={() =>
                        setExpandedOrgs((prev) => {
                          const next = new Set(prev);
                          if (next.has(org.id)) next.delete(org.id);
                          else next.add(org.id);
                          return next;
                        })
                      }
                      pathname={pathname}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          <SidebarSection
            label="Insights"
            expanded={expandedSections.insights}
            onToggle={() => toggleSection('insights')}
            collapsed={collapsed}
          >
            {filteredInsightsNav.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                onClose={onClose}
                collapsed={collapsed}
              />
            ))}
          </SidebarSection>

          {filteredConfigureNav.length > 0 && (
            <SidebarSection
              label="Configure"
              expanded={expandedSections.configure}
              onToggle={() => toggleSection('configure')}
              collapsed={collapsed}
            >
              {filteredConfigureNav.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onClose={onClose}
                  collapsed={collapsed}
                />
              ))}
            </SidebarSection>
          )}
        </nav>
      </div>

      {/* Collapse toggle footer */}
      {onToggleCollapse && (
        <div className="border-t border-border p-2 hidden md:block">
          <button
            onClick={onToggleCollapse}
            className={`flex items-center ${collapsed ? 'justify-center w-full' : 'justify-start gap-2 px-2'} py-1.5 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors text-xs w-full`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </aside>
  );
}

function SidebarSection({
  label,
  expanded,
  onToggle,
  collapsed,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  collapsed: boolean;
  children: ReactNode;
}) {
  if (collapsed) {
    return (
      <div className="pt-2 mt-2 border-t border-border first:border-t-0 first:pt-0 first:mt-0 space-y-1">
        {children}
      </div>
    );
  }
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/40"
      >
        {label}
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {expanded && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
}

function SidebarLink({
  item,
  pathname,
  onClose,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  onClose?: () => void;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const active = isActivePath(pathname, item.href);
  const accent = ACCENT_CLASSES[item.accent];

  const content = (
    <div
      className={`flex items-center ${collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 py-2'} rounded-lg text-sm transition-colors ${
        active
          ? `${accent.bgSoft} ${accent.text} font-medium`
          : `text-muted-foreground hover:bg-muted/50 hover:text-foreground`
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? accent.icon : accent.icon + ' opacity-70 group-hover:opacity-100'}`} />
      {!collapsed && <span className="truncate">{item.name}</span>}
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={item.href} onClick={onClose} className="group block">
            {content}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.name}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href={item.href} onClick={onClose} className="group block">
      {content}
    </Link>
  );
}

function OrgSpacesTree({
  org,
  expanded,
  onToggle,
  pathname,
}: {
  org: any;
  expanded: boolean;
  onToggle: () => void;
  pathname: string;
}) {
  const { data: spaces = [] } = useGetOrgSpacesQuery(org.id, { skip: !expanded });

  return (
    <div className="rounded-xl border border-transparent hover:border-border">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted/40"
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <Building2 className="h-4 w-4 text-sky-500" />
        <span className="truncate">{org.name}</span>
      </button>

      {expanded && (
        <div className="space-y-1 px-3 pb-2">
          {spaces.length === 0 ? (
            <p className="px-3 py-1 text-xs text-muted-foreground">No spaces yet</p>
          ) : (
            spaces.map((space: any) => {
              const active = pathname === `/spaces/${space.id}`;
              return (
                <Link key={space.id} href={`/spaces/${space.id}`}>
                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: space.color || '#2563eb' }}
                    />
                    <span className="truncate">{space.name}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
