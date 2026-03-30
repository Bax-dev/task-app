import { NextRequest } from 'next/server';
import { handleGenerateSubtasks } from '@/app/api/modules/ai/controllers';

export async function POST(request: NextRequest) {
  return handleGenerateSubtasks(request);
}
