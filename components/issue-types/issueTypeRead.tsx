'use client';

import { useState, useMemo } from 'react';
import {
  Plus, Loader2, Trash2, Search, Circle, Square, Triangle, Star,
  Zap, Bug, Bookmark, Flag, Target, Layers, LucideIcon,
  ArrowLeft, Settings2, Eye, Pencil, Hash, Calendar, ChevronDown,
  CheckSquare, Tag, Type, GripVertical, Asterisk,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  useGetOrgCustomFieldsQuery, useCreateCustomFieldMutation, useDeleteCustomFieldMutation,
} from '@/store/api';
import type { CustomField } from '@/types/custom-field';

// ─── Constants ───

const ISSUE_ICONS = ['circle', 'square', 'triangle', 'star', 'zap', 'bug', 'bookmark', 'flag', 'target', 'layers'];

const ICON_MAP: Record<string, LucideIcon> = {
  circle: Circle, square: Square, triangle: Triangle, star: Star,
  zap: Zap, bug: Bug, bookmark: Bookmark, flag: Flag, target: Target, layers: Layers,
};

const FIELD_TYPE_STYLES: Record<string, { label: string; color: string }> = {
  TEXT: { label: 'Text', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  NUMBER: { label: 'Number', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  DATE: { label: 'Date', color: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  DROPDOWN: { label: 'Dropdown', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
  CHECKBOX: { label: 'Checkbox', color: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20' },
  LABEL: { label: 'Label', color: 'bg-pink-500/10 text-pink-700 border-pink-500/20' },
};

const FIELD_TYPE_ICONS: Record<string, LucideIcon> = {
  TEXT: Type,
  NUMBER: Hash,
  DATE: Calendar,
  DROPDOWN: ChevronDown,
  CHECKBOX: CheckSquare,
  LABEL: Tag,
};

function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Circle;
}

// ─── Field Type Badge ───

function FieldTypeBadge({ fieldType }: { fieldType: string }) {
  const style = FIELD_TYPE_STYLES[fieldType] || { label: fieldType, color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' };
  const Icon = FIELD_TYPE_ICONS[fieldType] || Type;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.color}`}>
      <Icon className="w-3 h-3" />
      {style.label}
    </span>
  );
}

// ─── Preview Section ───

function FieldPreview({ fields }: { fields: CustomField[] }) {
  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No custom fields to preview. Add fields above to see a form preview.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Standard fields */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Title</Label>
          <div className="h-9 rounded-md border border-border bg-muted/30 px-3 flex items-center text-sm text-muted-foreground">
            Enter task title...
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
          <div className="h-16 rounded-md border border-border bg-muted/30 px-3 pt-2 text-sm text-muted-foreground">
            Enter description...
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-xs text-muted-foreground font-medium">Custom Fields</span>
        </div>
      </div>

      {/* Custom fields preview */}
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.id}>
            <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
              {field.name}
              {field.required && <Asterisk className="w-3 h-3 text-red-500" />}
            </Label>
            {field.fieldType === 'TEXT' && (
              <div className="h-9 rounded-md border border-border bg-muted/30 px-3 flex items-center text-sm text-muted-foreground">
                Enter {field.name.toLowerCase()}...
              </div>
            )}
            {field.fieldType === 'NUMBER' && (
              <div className="h-9 rounded-md border border-border bg-muted/30 px-3 flex items-center text-sm text-muted-foreground gap-2">
                <Hash className="w-3.5 h-3.5" /> 0
              </div>
            )}
            {field.fieldType === 'DATE' && (
              <div className="h-9 rounded-md border border-border bg-muted/30 px-3 flex items-center text-sm text-muted-foreground gap-2">
                <Calendar className="w-3.5 h-3.5" /> Pick a date...
              </div>
            )}
            {field.fieldType === 'DROPDOWN' && (
              <div className="h-9 rounded-md border border-border bg-muted/30 px-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>Select {field.name.toLowerCase()}...</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            )}
            {field.fieldType === 'CHECKBOX' && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border border-border bg-muted/30" />
                <span className="text-sm text-muted-foreground">{field.name}</span>
              </div>
            )}
            {field.fieldType === 'LABEL' && (
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(field.options) ? field.options.slice(0, 4) : ['Tag 1', 'Tag 2', 'Tag 3']).map((opt: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-pink-500/10 text-pink-700 border border-pink-500/20">
                    <Tag className="w-3 h-3" />
                    {opt}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Add Custom Field Dialog ───

function AddCustomFieldDialog({
  open,
  onOpenChange,
  issueTypeId,
  organizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueTypeId: string;
  organizationId: string;
}) {
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState('TEXT');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState('');

  const [createCustomField, { isLoading }] = useCreateCustomFieldMutation();

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const payload: any = {
        name: name.trim(),
        fieldType,
        required,
        issueTypeId,
        organizationId,
      };
      if (fieldType === 'DROPDOWN' || fieldType === 'LABEL') {
        payload.options = options.split(',').map((o) => o.trim()).filter(Boolean);
      }
      await createCustomField(payload).unwrap();
      toast.success('Custom field created');
      onOpenChange(false);
      setName('');
      setFieldType('TEXT');
      setRequired(false);
      setOptions('');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create custom field');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Add Custom Field
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
          className="space-y-4 pt-2"
        >
          <div className="space-y-2">
            <Label htmlFor="cf-name">Field Name</Label>
            <Input
              id="cf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priority Level, Due Date, Category..."
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Field Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(FIELD_TYPE_STYLES).map(([type, style]) => {
                const Icon = FIELD_TYPE_ICONS[type] || Type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFieldType(type)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      fieldType === type
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(fieldType === 'DROPDOWN' || fieldType === 'LABEL') && (
            <div className="space-y-2">
              <Label htmlFor="cf-options">Options (comma-separated)</Label>
              <textarea
                id="cf-options"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Option 1, Option 2, Option 3..."
                className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              {options && (
                <div className="flex flex-wrap gap-1.5">
                  {options.split(',').map((o) => o.trim()).filter(Boolean).map((opt, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border">
                      {opt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="cf-required"
              checked={required}
              onCheckedChange={(checked) => setRequired(checked === true)}
            />
            <Label htmlFor="cf-required" className="text-sm font-normal cursor-pointer">
              Required field
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()} className="gap-1.5">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isLoading ? 'Creating...' : 'Add Field'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Issue Type Detail View ───

function IssueTypeDetail({
  issueType,
  onBack,
  organizationId,
  isAdmin,
}: {
  issueType: any;
  onBack: () => void;
  organizationId: string;
  isAdmin: boolean;
}) {
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const { data: allCustomFields = [] } = useGetOrgCustomFieldsQuery(organizationId, { skip: !organizationId });
  const [deleteCustomField] = useDeleteCustomFieldMutation();

  const fields = useMemo(
    () => allCustomFields.filter((f: CustomField) => f.issueTypeId === issueType.id),
    [allCustomFields, issueType.id],
  );

  const IconComp = getIconComponent(issueType.icon);
  const typeColor = issueType.color || '#64748b';

  const handleDeleteField = async (fieldId: string) => {
    try {
      await deleteCustomField(fieldId).unwrap();
      toast.success('Custom field deleted');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete custom field');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to issue types
        </button>

        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${typeColor}20` }}
          >
            <IconComp className="w-7 h-7" style={{ color: typeColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-foreground">{issueType.name}</h2>
            {issueType.description && (
              <p className="text-muted-foreground mt-1">{issueType.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-muted-foreground">
                {issueType._count?.tasks ?? 0} {(issueType._count?.tasks ?? 0) === 1 ? 'task' : 'tasks'}
              </span>
              <span className="text-sm text-muted-foreground">
                {fields.length} custom {fields.length === 1 ? 'field' : 'fields'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Fields Section */}
        <div className="bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Custom Fields</h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {fields.length}
              </span>
            </div>
            {isAdmin && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddFieldOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                Add Field
              </Button>
            )}
          </div>

          <div className="divide-y divide-border">
            {fields.length === 0 ? (
              <div className="text-center py-10 px-5">
                <Settings2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No custom fields yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Add custom fields to capture additional information for this issue type.
                </p>
                {isAdmin && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddFieldOpen(true)}>
                    <Plus className="w-3.5 h-3.5" />
                    Add First Field
                  </Button>
                )}
              </div>
            ) : (
              fields.map((field: CustomField) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 px-5 py-3 group hover:bg-muted/30 transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {field.name}
                      </span>
                      {field.required && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                          <Asterisk className="w-2.5 h-2.5" />
                          Required
                        </span>
                      )}
                    </div>
                    {field.fieldType === 'DROPDOWN' && Array.isArray(field.options) && field.options.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Options: {field.options.join(', ')}
                      </p>
                    )}
                  </div>
                  <FieldTypeBadge fieldType={field.fieldType} />
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the field &quot;{field.name}&quot; and all its values across tasks.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteField(field.id)}
                            className="bg-muted-foreground text-background hover:bg-muted-foreground/90"
                          >
                            Delete Field
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Form Preview</h3>
          </div>
          <div className="p-5">
            <div className="rounded-lg border border-dashed border-border p-4 bg-muted/10">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${typeColor}20` }}
                >
                  <IconComp className="w-3 h-3" style={{ color: typeColor }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  New {issueType.name}
                </span>
              </div>
              <FieldPreview fields={fields} />
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Field Dialog */}
      <AddCustomFieldDialog
        open={addFieldOpen}
        onOpenChange={setAddFieldOpen}
        issueTypeId={issueType.id}
        organizationId={organizationId}
      />
    </div>
  );
}

// ─── Main Component ───

interface IssueTypeReadProps {
  issueTypes: any[];
  isLoading: boolean;
  selectedIssueTypeId: string | null;
  onSelectIssueType: (id: string | null) => void;
  onEditIssueType: (issueType: any) => void;
  onDeleteIssueType: (issueType: any) => void;
  organizationId: string;
  isAdmin: boolean;
}

export default function IssueTypeRead({
  issueTypes,
  isLoading,
  selectedIssueTypeId,
  onSelectIssueType,
  onEditIssueType,
  onDeleteIssueType,
  organizationId,
  isAdmin,
}: IssueTypeReadProps) {
  const [search, setSearch] = useState('');
  const { data: allCustomFields = [] } = useGetOrgCustomFieldsQuery(organizationId, { skip: !organizationId });

  const fieldCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allCustomFields.forEach((f: CustomField) => {
      if (f.issueTypeId) {
        map[f.issueTypeId] = (map[f.issueTypeId] || 0) + 1;
      }
    });
    return map;
  }, [allCustomFields]);

  const selectedType = useMemo(
    () => issueTypes.find((it: any) => it.id === selectedIssueTypeId),
    [issueTypes, selectedIssueTypeId],
  );

  // Detail view
  if (selectedType) {
    return (
      <IssueTypeDetail
        issueType={selectedType}
        onBack={() => onSelectIssueType(null)}
        organizationId={organizationId}
        isAdmin={isAdmin}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (issueTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">No issue types yet</h3>
        <p className="text-muted-foreground mb-4">Create your first issue type to categorize tasks</p>
      </div>
    );
  }

  const filtered = issueTypes.filter((it: any) =>
    it.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search issue types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No issue types match &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((issueType: any) => {
            const IconComp = getIconComponent(issueType.icon);
            const typeColor = issueType.color || '#64748b';
            const taskCount = issueType._count?.tasks ?? 0;
            const customFieldCount = fieldCountMap[issueType.id] || (issueType._count?.customFields ?? 0);
            const typeFields = allCustomFields.filter((f: CustomField) => f.issueTypeId === issueType.id);

            return (
              <div key={issueType.id} className="relative group">
                <div
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onSelectIssueType(issueType.id)}
                >
                  {/* Color accent bar */}
                  <div className="h-1" style={{ backgroundColor: typeColor }} />

                  <div className="p-5">
                    {/* Icon + Name */}
                    <div className="flex items-start gap-4 mb-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${typeColor}20` }}
                      >
                        <IconComp className="w-6 h-6" style={{ color: typeColor }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground text-base truncate">{issueType.name}</h3>
                        {issueType.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{issueType.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                        <Layers className="w-3 h-3" />
                        {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                        <Settings2 className="w-3 h-3" />
                        {customFieldCount} {customFieldCount === 1 ? 'field' : 'fields'}
                      </span>
                    </div>

                    {/* Field preview chips */}
                    {typeFields.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {typeFields.slice(0, 3).map((field: CustomField) => (
                          <FieldTypeBadge key={field.id} fieldType={field.fieldType} />
                        ))}
                        {typeFields.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium text-muted-foreground bg-muted border border-border">
                            +{typeFields.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Mini form preview */}
                    <div className="rounded-lg border border-dashed border-border/60 p-3 bg-muted/10">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Eye className="w-3 h-3 text-muted-foreground/50" />
                        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Preview</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-5 rounded bg-muted/40 w-full" />
                        <div className="h-5 rounded bg-muted/30 w-3/4" />
                        {typeFields.slice(0, 2).map((field: CustomField) => (
                          <div key={field.id} className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground/50 truncate w-16">{field.name}</span>
                            <div className="h-4 rounded bg-muted/30 flex-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-border px-5 py-2.5 flex items-center justify-between bg-muted/20">
                    <span className="text-xs text-muted-foreground">
                      Click to manage fields
                    </span>
                    <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground rotate-180" />
                  </div>
                </div>

                {/* Admin actions */}
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditIssueType(issueType); }}
                      className="p-1.5 rounded-md bg-card/80 backdrop-blur-sm hover:bg-muted text-muted-foreground hover:text-primary border border-border shadow-sm"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteIssueType(issueType); }}
                      className="p-1.5 rounded-md bg-card/80 backdrop-blur-sm hover:bg-muted text-muted-foreground hover:text-foreground border border-border shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
