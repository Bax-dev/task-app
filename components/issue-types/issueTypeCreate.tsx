'use client';

import { useState } from 'react';
import {
  Plus, Loader2, Check, Circle, Square, Triangle, Star,
  Zap, Bug, Bookmark, Flag, Target, Layers, LucideIcon, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCreateIssueTypeMutation } from '@/store/api';

// ─── Constants ───

const ISSUE_ICONS = ['circle', 'square', 'triangle', 'star', 'zap', 'bug', 'bookmark', 'flag', 'target', 'layers'];

const ISSUE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b'];

const ICON_MAP: Record<string, LucideIcon> = {
  circle: Circle, square: Square, triangle: Triangle, star: Star,
  zap: Zap, bug: Bug, bookmark: Bookmark, flag: Flag, target: Target, layers: Layers,
};

function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Circle;
}

// ─── Color Picker ───

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ISSUE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center hover:scale-110"
          style={{
            backgroundColor: color,
            borderColor: value === color ? 'white' : 'transparent',
            boxShadow: value === color ? `0 0 0 2px ${color}` : 'none',
          }}
          onClick={() => onChange(color)}
        >
          {value === color && <Check className="w-4 h-4 text-white" />}
        </button>
      ))}
    </div>
  );
}

// ─── Component ───

interface IssueTypeCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

export default function IssueTypeCreate({ open, onOpenChange, organizationId, organizationName }: IssueTypeCreateProps) {
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState(ISSUE_ICONS[0]);
  const [newColor, setNewColor] = useState(ISSUE_COLORS[5]);

  const [createIssueType, { isLoading: isCreating }] = useCreateIssueTypeMutation();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createIssueType({
        name: newName.trim(),
        description: newDescription.trim(),
        icon: newIcon,
        color: newColor,
        organizationId,
      }).unwrap();
      toast.success('Issue type created');
      onOpenChange(false);
      setNewName('');
      setNewDescription('');
      setNewIcon(ISSUE_ICONS[0]);
      setNewColor(ISSUE_COLORS[5]);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create issue type');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Issue Type</span>
            </div>
          </div>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Issue Type Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Describe this issue type..."
            className="w-full border-0 bg-transparent resize-none min-h-[60px] px-5 py-2 placeholder:text-muted-foreground/40 text-sm focus:outline-none"
            rows={2}
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Icon</p>
              <div className="flex flex-wrap gap-1.5">
                {ISSUE_ICONS.map((icon) => {
                  const IC = getIconComponent(icon);
                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewIcon(icon)}
                      className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${newIcon === icon ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/30'}`}
                    >
                      <IC className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Color</p>
              <ColorPicker value={newColor} onChange={setNewColor} />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white" style={{ backgroundColor: newColor }}>
                {(() => { const IC = getIconComponent(newIcon); return <IC className="w-3.5 h-3.5" />; })()}
                {newName || 'Issue Type'}
              </div>
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary">
              <Building2 className="w-3.5 h-3.5" />
              {organizationName}
            </div>
            <Button type="submit" disabled={isCreating || !newName.trim()} size="sm" className="gap-1.5 px-5">
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isCreating ? 'Creating...' : 'Create Issue Type'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
