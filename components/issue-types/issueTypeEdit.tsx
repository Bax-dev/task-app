'use client';

import { useState, useEffect } from 'react';
import {
  Loader2, Check, Circle, Square, Triangle, Star,
  Zap, Bug, Bookmark, Flag, Target, Layers, LucideIcon, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUpdateIssueTypeMutation } from '@/store/api';

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

interface IssueTypeEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueType: { id: string; name: string; description: string | null; icon: string; color: string };
}

export default function IssueTypeEdit({ open, onOpenChange, issueType }: IssueTypeEditProps) {
  const [name, setName] = useState(issueType.name);
  const [description, setDescription] = useState(issueType.description || '');
  const [icon, setIcon] = useState(issueType.icon);
  const [color, setColor] = useState(issueType.color);

  const [updateIssueType, { isLoading }] = useUpdateIssueTypeMutation();

  useEffect(() => {
    if (open) {
      setName(issueType.name);
      setDescription(issueType.description || '');
      setIcon(issueType.icon);
      setColor(issueType.color);
    }
  }, [open, issueType]);

  const handleUpdate = async () => {
    if (!name.trim()) return;
    try {
      await updateIssueType({
        id: issueType.id,
        name: name.trim(),
        description: description.trim() || null,
        icon,
        color,
      }).unwrap();
      toast.success('Issue type updated');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update issue type');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <Pencil className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Edit Issue Type</span>
            </div>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Issue Type Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this issue type..."
            className="w-full border-0 bg-transparent resize-none min-h-[60px] px-5 py-2 placeholder:text-muted-foreground/40 text-sm focus:outline-none"
            rows={2}
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Icon</p>
              <div className="flex flex-wrap gap-1.5">
                {ISSUE_ICONS.map((ic) => {
                  const IC = getIconComponent(ic);
                  return (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${icon === ic ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/30'}`}
                    >
                      <IC className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Color</p>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white" style={{ backgroundColor: color }}>
                {(() => { const IC = getIconComponent(icon); return <IC className="w-3.5 h-3.5" />; })()}
                {name || 'Issue Type'}
              </div>
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()} size="sm" className="gap-1.5 px-5">
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
