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
import { useGetOrganizationsQuery, useCreateSpaceMutation, useGetOrgSpacesQuery } from '@/store/api';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Organizations', href: '/organizations', icon: Building2 },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Activity Logs', href: '/activity-logs', icon: Activity },
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const SPACE_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#db2777', '#9333ea', '#0891b2', '#65a30d', '#ea580c',
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [newSpaceOpen, setNewSpaceOpen] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [spaceColor, setSpaceColor] = useState('#7c3aed');
  const [spaceOrgId, setSpaceOrgId] = useState('');

  const { data: organizations = [] } = useGetOrganizationsQuery();

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
    <aside className="w-64 border-r border-border bg-card flex flex-col overflow-hidden">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard">
          <h1 className="text-2xl font-bold text-primary">TaskFlow</h1>
        </Link>
      </div>

      <nav className="p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}>
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Spaces Section */}
      <div className="flex-1 overflow-auto border-t border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spaces</span>
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

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">TaskFlow v1.0</div>
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
