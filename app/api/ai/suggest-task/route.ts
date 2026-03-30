import { NextRequest } from 'next/server';
import { handleSuggestTask } from '@/app/api/modules/ai/controllers';

export async function POST(request: NextRequest) {
  return handleSuggestTask(request);
}
