'use client';

import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetOrgCustomFieldsQuery,
  useGetTaskCustomFieldValuesQuery,
  useSetCustomFieldValueMutation,
} from '@/store/api';
import SideField from '@/components/tasks/SideField';
import type { CustomField } from '@/types/custom-field';

interface TaskCustomFieldsProps {
  taskId: string;
  orgId: string;
  issueTypeId?: string | null;
  readOnly?: boolean;
}

export default function TaskCustomFields({ taskId, orgId, issueTypeId, readOnly }: TaskCustomFieldsProps) {
  const { data: fields = [] } = useGetOrgCustomFieldsQuery(orgId);
  const { data: values = [] } = useGetTaskCustomFieldValuesQuery(taskId);
  const [setValue] = useSetCustomFieldValueMutation();

  const applicable = fields.filter((f) => !f.issueTypeId || f.issueTypeId === issueTypeId);
  const valueOf = (fieldId: string) => values.find((v) => v.customFieldId === fieldId)?.value ?? '';

  const save = async (field: CustomField, value: string) => {
    if (value === valueOf(field.id)) return;
    try {
      await setValue({ taskId, customFieldId: field.id, value }).unwrap();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || `Failed to update ${field.name}`);
    }
  };

  return (
    <>
      {applicable.map((field) => {
        const value = valueOf(field.id);
        const label = field.required ? `${field.name} *` : field.name;
        const options: string[] = Array.isArray(field.options) ? field.options : [];

        if (readOnly) {
          const display = field.fieldType === 'CHECKBOX' ? (value === 'true' ? 'Yes' : 'No') : value;
          return (
            <SideField key={field.id} label={label}>
              <span className={`text-sm ${display ? '' : 'text-muted-foreground'}`}>{display || '—'}</span>
            </SideField>
          );
        }

        let input: React.ReactNode;
        switch (field.fieldType) {
          case 'CHECKBOX':
            input = (
              <Checkbox
                checked={value === 'true'}
                onCheckedChange={(checked) => save(field, String(checked === true))}
                aria-label={field.name}
              />
            );
            break;
          case 'DROPDOWN':
          case 'LABEL':
            input = (
              <Select value={value} onValueChange={(v) => save(field, v)}>
                <SelectTrigger className="h-8 border-0 shadow-none bg-transparent hover:bg-secondary/50 px-2" aria-label={field.name}>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
            break;
          default:
            // Uncontrolled + key on saved value so server updates reset the input; save on blur/Enter.
            input = (
              <Input
                key={value}
                type={field.fieldType === 'NUMBER' ? 'number' : field.fieldType === 'DATE' ? 'date' : 'text'}
                defaultValue={value}
                className="h-7 text-xs"
                aria-label={field.name}
                onBlur={(e) => save(field, e.target.value.trim())}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              />
            );
        }
        return <SideField key={field.id} label={label}>{input}</SideField>;
      })}
    </>
  );
}
