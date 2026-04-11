'use client';

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

type HeaderMeta = {
  label: string;
  value: string | number;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  meta = [],
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  meta?: HeaderMeta[];
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          {eyebrow && <div>{eyebrow}</div>}
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            )}
          </div>
          {meta.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {meta.map((item) => (
                <Badge key={item.label} variant="outline" className="gap-1.5 rounded-full px-3 py-1">
                  <span className="text-foreground">{item.value}</span>
                  <span className="text-muted-foreground">{item.label}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
