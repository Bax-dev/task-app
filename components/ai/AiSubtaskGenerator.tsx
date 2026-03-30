'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { useAiGenerateSubtasksMutation } from '@/store/api';

export default function AiSubtaskGenerator({
  taskTitle,
  taskDescription,
  onAdd,
}: {
  taskTitle: string;
  taskDescription?: string;
  onAdd: (subtasks: string[]) => void;
}) {
  const [generated, setGenerated] = useState<string[]>([]);
  const [generateSubtasks, { isLoading }] = useAiGenerateSubtasksMutation();

  const handleGenerate = async () => {
    if (!taskTitle.trim()) return;

    try {
      const result = await generateSubtasks({
        taskTitle: taskTitle.trim(),
        taskDescription,
      }).unwrap();
      setGenerated(Array.isArray(result) ? result : []);
    } catch {
      setGenerated([]);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleGenerate}
        disabled={!taskTitle.trim() || isLoading}
        className="gap-1.5 text-xs"
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        AI generate subtasks
      </Button>

      {generated.length > 0 && (
        <div className="rounded-lg border border-border p-2 space-y-1.5">
          {generated.map((sub, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="flex-1 text-foreground">{sub}</span>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onAdd(generated);
              setGenerated([]);
            }}
            className="w-full gap-1.5 text-xs mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add all subtasks
          </Button>
        </div>
      )}
    </div>
  );
}
