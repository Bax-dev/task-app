'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
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

interface IntegrationEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: { id: string; name: string; type: string; config: any; enabled: boolean };
}

export default function IntegrationEdit({
  open,
  onOpenChange,
  integration,
}: IntegrationEditProps) {
  const [name, setName] = useState(integration.name);
  const [enabled, setEnabled] = useState(integration.enabled);
  const [updateIntegration, { isLoading: isUpdating }] = useUpdateIntegrationMutation();

  useEffect(() => {
    if (open) {
      setName(integration.name);
      setEnabled(integration.enabled);
    }
  }, [open, integration]);

  const handleSave = async () => {
    try {
      await updateIntegration({
        id: integration.id,
        name,
        enabled,
      }).unwrap();
      toast.success('Integration updated');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update integration');
    }
  };

  const platform = PLATFORMS[integration.type] || {
    label: integration.type,
    color: '#6b7280',
    desc: '',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 gap-0 overflow-hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Edit Integration
              </span>
            </div>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Integration Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.label[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{platform.label}</p>
                  <p className="text-xs text-muted-foreground">{platform.desc}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Connection Status</p>
                <p className="text-xs text-muted-foreground">
                  {enabled ? 'Integration is active' : 'Integration is inactive'}
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || !name.trim()}
              size="sm"
              className="gap-1.5 px-5"
            >
              {isUpdating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plug className="w-3.5 h-3.5" />
              )}
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
