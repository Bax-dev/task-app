'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Settings,
  Building2,
  Users,
  Plus,
  ChevronDown,
  ChevronRight,
  Loader2,
  FileText,
  Activity,
  X,
  CalendarDays,
  BarChart3,
  Star,
  Kanban,
  Tags,
  Repeat2,
  Zap,
  Plug,
  Filter,
  GaugeCircle,
  Layers,
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
import { toast } from 'sonner';
import { useGetOrganizationsQuery, useCreateSpaceMutation, useGetOrgSpacesQuery, useGetOrgMembersQuery, useGetMeQuery } from '@/store/api';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
}

const navSections: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Quick Access', href: '/favorites', icon: Star },
    ],
  },
  {
    label: 'Work',
    items: [
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
      { name: 'Projects', href: '/projects', icon: FolderOpen },
      { name: 'Boards', href: '/boards', icon: Kanban },
      { name: 'Sprints', href: '/sprints', icon: Repeat2 },
      { name: 'Calendar', href: '/calendar', icon: CalendarDays },
      { name: 'Notes', href: '/notes', icon: FileText },
    ],
  },
  {
    label: 'Team',
    items: [
      { name: 'Organizations', href: '/organizations', icon: Building2 },
      { name: 'Members', href: '/team', icon: Users },
    ],
  },
  {
    label: 'Configure',
    items: [
      { name: 'Labels', href: '/labels', icon: Tags },
      { name: 'Issue Types', href: '/issue-types', icon: Layers, adminOnly: true },
      { name: 'Workflows', href: '/workflows', icon: GaugeCircle, adminOnly: true },
      { name: 'Automations', href: '/automations', icon: Zap, adminOnly: true },
      { name: 'Integrations', href: '/integrations', icon: Plug, adminOnly: true },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Reports', href: '/reports', icon: BarChart3 },
      { name: 'Dashboards', href: '/dashboards', icon: LayoutDashboard },
      { name: 'Saved Filters', href: '/saved-filters', icon: Filter },
      { name: 'Audit Logs', href: '/activity-logs', icon: Activity, adminOnly: true },
    ],
  },
];

const SPACE_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#db2777', '#9333ea', '#0891b2', '#65a30d', '#ea580c',
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [newSpaceOpen, setNewSpaceOpen] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [spaceColor, setSpaceColor] = useState('#7c3aed');
  const [spaceOrgId, setSpaceOrgId] = useState('');

  const { data: user } = useGetMeQuery();
  const { data: organizations = [] } = useGetOrganizationsQuery();
  const firstOrgId = organizations[0]?.id || '';
  const { data: orgMembers = [] } = useGetOrgMembersQuery(firstOrgId, { skip: !firstOrgId });
  const isAdmin = orgMembers.some((m: any) => m.id === user?.id && m.role === 'ADMIN');

  const toggleOrg = (orgId: string) => {
    setExpandedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) next.delete(orgId);
      else next.add(orgId);
      return next;
    });
  };

  const [createSpace, { isLoading: isCreatingSpace }] = useCreateSpaceMutation();

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSpace({ name: spaceName, color: spaceColor, organizationId: spaceOrgId }).unwrap();
      toast.success('Space created!');
      setNewSpaceOpen(false);
      setSpaceName('');
      setSpaceColor('#7c3aed');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create space');
    }
  };

  return (
    <aside className="w-60 h-full border-r border-border bg-card flex flex-col overflow-hidden">
      <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
        <Link href="/dashboard" onClick={onClose}>
          <span className="text-lg font-bold text-primary">TaskFlow</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="p-2 space-y-3 overflow-auto">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {section.label && (
              <span className="px-2.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                {section.label}
              </span>
            )}
            <div className={`space-y-px ${section.label ? 'mt-1' : ''}`}>
              {section.items.filter((item) => !item.adminOnly || isAdmin).map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/favorites' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={onClose}>
                    <div className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-md transition-colors text-[13px] ${
                      isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Spaces Section */}
      <div className="flex-1 overflow-auto border-t border-border">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Spaces</span>
          <Dialog open={newSpaceOpen} onOpenChange={setNewSpaceOpen}>
            <DialogTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <Plus className="w-4 h-4" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Space</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSpace} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Select value={spaceOrgId} onValueChange={setSpaceOrgId}>
                    <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                    <SelectContent>
                      {organizations.map((org: any) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Space Name</Label>
                  <Input value={spaceName} onChange={(e) => setSpaceName(e.target.value)} placeholder="e.g. Sales, Marketing" required />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {SPACE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSpaceColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${spaceColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isCreatingSpace || !spaceOrgId}>
                  {isCreatingSpace ? 'Creating...' : 'Create Space'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="px-2 pb-4 space-y-1">
          {organizations.map((org: any) => (
            <OrgSpacesTree key={org.id} org={org} expanded={expandedOrgs.has(org.id)} onToggle={() => toggleOrg(org.id)} pathname={pathname} />
          ))}
        </div>
      </div>

      <div className="p-2 border-t border-border">
        <Link href="/settings" onClick={onClose}>
          <div className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-md transition-colors text-[13px] ${
            pathname === '/settings' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          }`}>
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}

function OrgSpacesTree({ org, expanded, onToggle, pathname }: { org: any; expanded: boolean; onToggle: () => void; pathname: string }) {
  const { data: spaces = [], isLoading } = useGetOrgSpacesQuery(org.id, {
    skip: !expanded,
  });

  return (
    <div>
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <span className="font-medium truncate">{org.name}</span>
      </button>
      {expanded && (
        <div className="ml-3 pl-3 border-l border-border space-y-0.5 mt-0.5">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading...
            </div>
          ) : spaces.length > 0 ? (
            spaces.map((space: any) => (
              <Link key={space.id} href={`/spaces/${space.id}`}>
                <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === `/spaces/${space.id}` ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}>
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: space.color }} />
                  <span className="truncate">{space.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{space._count?.projects || 0}</span>
                </div>
              </Link>
            ))
          ) : (
            <p className="px-2 py-1 text-xs text-muted-foreground">No spaces</p>
          )}
        </div>
      )}
    </div>
  );
}
