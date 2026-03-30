'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, X } from 'lucide-react';
import { useAiSummarizeMutation } from '@/store/api';

export default function AiSummary({
  organizationId,
  type,
  targetId,
}: {
  organizationId: string;
  type: 'sprint' | 'project' | 'daily';
  targetId?: string;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [summarize, { isLoading }] = useAiSummarizeMutation();

  const handleSummarize = async () => {
    try {
      const result = await summarize({ organizationId, type, targetId }).unwrap();
      setSummary(result.summary);
    } catch {
      setSummary('Unable to generate summary.');
    }
  };

  if (summary) {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 relative">
        <button
          onClick={() => setSummary(null)}
          className="absolute top-2 right-2 p-0.5 rounded text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">AI Summary</span>
        </div>
        <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{summary}</div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSummarize}
      disabled={isLoading}
      className="gap-1.5 text-xs"
    >
      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
      AI Summary
    </Button>
  );
}
