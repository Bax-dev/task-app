'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plug, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCreateIntegrationMutation } from '@/store/api';

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

interface IntegrationCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
  prefilledType?: string;
}

export default function IntegrationCreate({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  prefilledType,
}: IntegrationCreateProps) {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('');
  const [createIntegration, { isLoading: isCreating }] = useCreateIntegrationMutation();

  useEffect(() => {
    if (open) {
      setNewType(prefilledType || '');
      setNewName('');
    }
  }, [open, prefilledType]);

  const handleCreate = async () => {
    try {
      await createIntegration({
        name: newName,
        type: newType,
        organizationId,
      }).unwrap();
      toast.success('Integration created');
      onOpenChange(false);
      setNewName('');
      setNewType('');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create integration');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Integration
              </span>
            </div>
          </div>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Integration Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Select Platform
            </p>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(PLATFORMS).map(([key, { label, color }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewType(key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-xs font-medium ${
                    newType === key
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/30'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary">
              <Building2 className="w-3.5 h-3.5" />
              {organizationName || 'Organization'}
            </div>
            <Button
              type="submit"
              disabled={isCreating || !newName.trim() || !newType}
              size="sm"
              className="gap-1.5 px-5"
            >
              {isCreating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plug className="w-3.5 h-3.5" />
              )}
              {isCreating ? 'Creating...' : 'Create Integration'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
