'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Check, ArrowRight } from 'lucide-react';
import { useAiSuggestTaskMutation } from '@/store/api';

interface AiSuggestion {
  title: string;
  description: string;
  priority: string;
  subtasks: string[];
}

export default function AiTaskSuggestion({
  projectId,
  onApply,
}: {
  projectId: string;
  onApply: (suggestion: AiSuggestion) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [suggestTask, { isLoading }] = useAiSuggestTaskMutation();

  const handleGenerate = async () => {
    if (!prompt.trim() || !projectId) return;

    try {
      const result = await suggestTask({ prompt: prompt.trim(), projectId }).unwrap();
      setSuggestion(result);
    } catch {
      setSuggestion(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  if (!projectId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="font-medium">AI-assisted creation</span>
      </div>

      <div className="flex gap-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the task in plain language... e.g. 'Add user avatar upload to settings page'"
          className="min-h-[36px] max-h-[80px] resize-none text-[13px]"
          rows={1}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isLoading}
          className="flex-shrink-0 self-end gap-1.5"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Generate
        </Button>
      </div>

      {suggestion && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-3">{suggestion.description}</p>
            </div>
            <Badge variant="outline" className="text-[10px] flex-shrink-0">
              {suggestion.priority}
            </Badge>
          </div>

          {suggestion.subtasks?.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Subtasks:</p>
              {suggestion.subtasks.slice(0, 5).map((sub, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                  <Check className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className="truncate">{sub}</span>
                </div>
              ))}
            </div>
          )}

          <Button
            size="sm"
            onClick={() => {
              onApply(suggestion);
              setSuggestion(null);
              setPrompt('');
            }}
            className="w-full gap-1.5 text-xs"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Apply to form
          </Button>
        </div>
      )}
    </div>
  );
}
