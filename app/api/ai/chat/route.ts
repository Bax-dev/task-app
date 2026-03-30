import { NextRequest } from 'next/server';
import { handleChat } from '@/app/api/modules/ai/controllers';

export async function POST(request: NextRequest) {
  return handleChat(request);
}
