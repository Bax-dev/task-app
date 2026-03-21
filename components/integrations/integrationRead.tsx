'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Loader2,
  Trash2,
  Search,
  Plug,
  Settings,
  Check,
  ChevronDown,
  ChevronUp,
  Link2,
  Zap,
  LayoutGrid,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useUpdateIntegrationMutation } from '@/store/api';

const PLATFORMS: Record<string, { label: string; color: string; desc: string }> = {
  GITHUB: { label: 'GitHub', color: '#24292f', desc: 'Link PRs and commits to tasks' },
  GITLAB: { label: 'GitLab', color: '#fc6d26', desc: 'Track merge requests and pipelines' },
  BITBUCKET: { label: 'Bitbucket', color: '#0052cc', desc: 'Connect repos and pull requests' },
  SLACK: { label: 'Slack', color: '#4a154b', desc: 'Get notifications in channels' },
  CONFLUENCE: { label: 'Confluence', color: '#1868db', desc: 'Link docs to issues' },
  FIGMA: { label: 'Figma', color: '#f24e1e', desc: 'Attach designs to tasks' },
  ZENDESK: { label: 'Zendesk', color: '#03363d', desc: 'Connect support tickets' },
  SALESFORCE: { label: 'Salesforce', color: '#00a1e0', desc: 'Sync CRM data with tasks' },
};

interface IntegrationReadProps {
  integrations: any[];
  isLoading: boolean;
  onEditIntegration: (integration: any) => void;
  onDeleteIntegration: (integration: any) => void;
  onAddPlatform: (type: string) => void;
  isAdmin: boolean;
  organizationName: string;
}

export default function IntegrationRead({
  integrations,
  isLoading,
  onEditIntegration,
  onDeleteIntegration,
  onAddPlatform,
  isAdmin,
  organizationName,
}: IntegrationReadProps) {
  const [search, setSearch] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [updateIntegration] = useUpdateIntegrationMutation();

  // Stats
  const stats = useMemo(() => {
    const total = integrations.length;
    const connected = integrations.filter((i: any) => i.enabled).length;
    const platformsUsed = new Set(integrations.map((i: any) => i.type)).size;
    return { total, connected, platformsUsed };
  }, [integrations]);

  // Connected platform types
  const connectedPlatforms = useMemo(
    () => new Set(integrations.map((i: any) => i.type)),
    [integrations]
  );

  const filtered = useMemo(
    () =>
      integrations.filter((i: any) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      ),
    [integrations, search]
  );

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await updateIntegration({ id, enabled }).unwrap();
      toast.success(enabled ? 'Integration connected' : 'Integration disconnected');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update integration');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Integrations</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.connected}</p>
            <p className="text-xs text-muted-foreground">Connected</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.platformsUsed}</p>
            <p className="text-xs text-muted-foreground">Platforms Used</p>
          </div>
        </div>
      </div>

      {/* Available Platforms */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Available Platforms
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(PLATFORMS).map(([key, { label, color, desc }]) => {
            const isConnected = connectedPlatforms.has(key);
            return (
              <button
                key={key}
                onClick={() => isAdmin && onAddPlatform(key)}
                disabled={!isAdmin}
                className={`relative text-left p-4 rounded-xl border-2 transition-all group ${
                  isAdmin
                    ? 'hover:border-primary/40 hover:shadow-sm cursor-pointer'
                    : 'cursor-default'
                } ${isConnected ? 'border-border bg-card' : 'border-dashed border-border/60 bg-muted/20'}`}
              >
                {isConnected && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3"
                  style={{ backgroundColor: color }}
                >
                  {label[0]}
                </div>
                <p className="font-semibold text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                {isAdmin && !isConnected && (
                  <span className="text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-2 inline-block">
                    + Add integration
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + Integration Cards */}
      {integrations.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Your Integrations
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-56 h-9 text-sm"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No integrations match &quot;{search}&quot;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((integration: any) => {
                const platform = PLATFORMS[integration.type] || {
                  label: integration.type,
                  color: '#6b7280',
                  desc: '',
                };
                const isExpanded = expandedCard === integration.id;
                const createdDate = integration.createdAt
                  ? new Date(integration.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : null;

                return (
                  <div
                    key={integration.id}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all"
                  >
                    <div className="p-5">
                      {/* Top row: Icon + Name + Status */}
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                          style={{ backgroundColor: platform.color }}
                        >
                          {platform.label[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground truncate text-base">
                              {integration.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-white text-[10px] px-2 py-0"
                              style={{ backgroundColor: platform.color }}
                            >
                              {platform.label}
                            </Badge>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  integration.enabled ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                              />
                              <span
                                className={`text-xs font-medium ${
                                  integration.enabled
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {integration.enabled ? 'Connected' : 'Disconnected'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <Switch
                            checked={integration.enabled}
                            onCheckedChange={(checked) =>
                              handleToggleEnabled(integration.id, checked)
                            }
                          />
                        )}
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Created by{' '}
                            <span className="font-medium text-foreground/80">
                              {integration.createdBy?.name ||
                                integration.createdBy?.email ||
                                'Unknown'}
                            </span>
                          </span>
                          {createdDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {createdDate}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              setExpandedCard(isExpanded ? null : integration.id)
                            }
                          >
                            <Settings className="w-3.5 h-3.5" />
                            Configure
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                              onClick={() => onDeleteIntegration(integration)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded config panel */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 px-5 py-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Configuration Details
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Integration ID</p>
                            <p className="font-mono text-xs text-foreground mt-0.5 truncate">
                              {integration.id}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Platform</p>
                            <p className="text-xs text-foreground mt-0.5">{platform.label}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <p className="text-xs text-foreground mt-0.5">
                              {integration.enabled ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Organization</p>
                            <p className="text-xs text-foreground mt-0.5 truncate">
                              {organizationName}
                            </p>
                          </div>
                        </div>
                        {integration.config &&
                          Object.keys(integration.config).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs text-muted-foreground mb-2">
                                Custom Config
                              </p>
                              <pre className="text-[11px] font-mono bg-muted rounded-md p-2 overflow-x-auto text-foreground/80">
                                {JSON.stringify(integration.config, null, 2)}
                              </pre>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Empty state for no integrations at all */}
      {integrations.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Plug className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No integrations yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Click any platform above to add your first integration
          </p>
          {isAdmin && (
            <Button onClick={() => onAddPlatform('')} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Integration
            </Button>
          )}
        </div>
      )}
    </>
  );
}
