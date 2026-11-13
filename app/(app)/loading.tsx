import { Skeleton } from '@/components/ui/skeleton';

export default function AppLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
