import { NextRequest } from 'next/server';
import { handleLogout } from '@/app/api/modules/auth/controllers';

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
