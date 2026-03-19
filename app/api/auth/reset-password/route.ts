import { NextRequest } from 'next/server';
import { handleResetPassword } from '@/app/api/modules/auth/controllers';

export async function POST(request: NextRequest) {
  return handleResetPassword(request);
}
