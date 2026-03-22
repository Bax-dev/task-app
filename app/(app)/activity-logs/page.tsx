'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Activity, Loader2, Search, Shield } from 'lucide-react';
import { useGetOrganizationsQuery, useGetOrgActivityLogsQuery, useGetOrgMembersQuery } from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');

  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();

  // Auto-select first org
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations, selectedOrg]);

  const { data: members = [] } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });
  const isAdmin = members.some((m: any) => m.id === user?.id && m.role === 'ADMIN');

  const { data: logs = [], isLoading: logsLoading } = useGetOrgActivityLogsQuery(selectedOrg, { skip: !selectedOrg || !isAdmin });

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && selectedOrg) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Admin Only</h2>
          <p className="text-muted-foreground text-sm">Audit logs are only accessible to organization admins.</p>
        </div>
      </div>
    );
  }

  const searchLower = search.toLowerCase();
  const filteredLogs = search
    ? logs.filter((l: any) =>
        l.description?.toLowerCase().includes(searchLower) ||
        l.createdBy?.name?.toLowerCase().includes(searchLower) ||
        l.createdBy?.email?.toLowerCase().includes(searchLower) ||
        l.task?.title?.toLowerCase().includes(searchLower)
      )
    : logs;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track all actions across your organization</p>
        </div>
        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org: any) => (
              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by action, user, or task..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      {logsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-1">
          {filteredLogs.map((log: any, i: number) => {
            const prev: any = filteredLogs[i - 1];
            const logDate = new Date(log.loggedAt || log.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            const prevDate = prev ? new Date(prev.loggedAt || prev.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : null;
            const showDate = logDate !== prevDate;

            return (
              <div key={log.id}>
                {showDate && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4 pb-2 first:pt-0">
                    {logDate}
                  </p>
                )}
                <div className="flex gap-3 py-2.5 px-3 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">
                      {(log.createdBy?.name?.[0] || log.createdBy?.email?.[0] || '?').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{log.createdBy?.name || log.createdBy?.email || 'System'}</span>
                      {' '}
                      <span className="text-muted-foreground">{log.description}</span>
                    </p>
                    {log.task && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Task: {log.task.title}
                      </p>
                    )}
                    {log.note && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">{log.note}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-1">
                    {new Date(log.loggedAt || log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1">No audit logs yet</h3>
          <p className="text-sm text-muted-foreground">Actions will appear here as your team works.</p>
        </div>
      )}
    </div>
  );
}
