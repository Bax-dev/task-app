import { NextRequest } from 'next/server';
import { handleSummarize } from '@/app/api/modules/ai/controllers';

export async function POST(request: NextRequest) {
  return handleSummarize(request);
}
