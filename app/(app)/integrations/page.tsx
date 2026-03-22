'use client';

import { Plug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function IntegrationsPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center justify-center text-center py-24">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Plug className="w-8 h-8 text-muted-foreground" />
        </div>
        <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
          Coming Soon
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Integrations</h1>
        <p className="text-muted-foreground max-w-md">
          Connect your favorite tools and services like Slack, GitHub, Jira, and more.
          We&apos;re working hard to bring this feature to you.
        </p>
      </div>
    </div>
  );
}
