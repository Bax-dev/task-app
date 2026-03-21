import { NextRequest } from 'next/server';
import { ReadSavedFilters } from '@/app/api/modules/saved-filters/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadSavedFilters(request, id);
}
