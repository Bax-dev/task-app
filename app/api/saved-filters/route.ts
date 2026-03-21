import { NextRequest } from 'next/server';
import { CreateSavedFilter } from '@/app/api/modules/saved-filters/controllers';

export async function POST(request: NextRequest) {
  return CreateSavedFilter(request);
}
