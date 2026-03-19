import { NextRequest } from 'next/server';
import { handleGetMe } from '@/app/api/modules/auth/controllers';

export async function GET(request: NextRequest) {
  return handleGetMe(request);
}
