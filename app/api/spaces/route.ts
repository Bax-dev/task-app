import { NextRequest } from 'next/server';
import { handleCreateSpace } from '@/app/api/modules/spaces/controllers';

export async function POST(request: NextRequest) {
  return handleCreateSpace(request);
}
