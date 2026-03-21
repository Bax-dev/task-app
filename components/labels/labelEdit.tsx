'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateLabelMutation } from '@/store/api';
import { toast } from 'sonner';

const LABEL_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b',
];

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {LABEL_COLORS.map((color) => (
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

interface LabelEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: { id: string; name: string; color: string };
}

export default function LabelEdit({ open, onOpenChange, label }: LabelEditProps) {
  const [editName, setEditName] = useState(label.name);
  const [editColor, setEditColor] = useState(label.color || LABEL_COLORS[5]);

  const [updateLabel] = useUpdateLabelMutation();

  useEffect(() => {
    setEditName(label.name);
    setEditColor(label.color || LABEL_COLORS[5]);
  }, [label]);

  const handleUpdate = async () => {
    if (!editName.trim()) return;
    try {
      await updateLabel({ id: label.id, name: editName.trim(), color: editColor }).unwrap();
      toast.success('Label updated');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update label');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Label</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Label name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker value={editColor} onChange={setEditColor} />
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: editColor }} />
              <span className="text-sm text-muted-foreground">{editColor}</span>
            </div>
          </div>
          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
