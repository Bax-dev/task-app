import { NextRequest } from 'next/server';
import { handleVerifyOTP } from '@/app/api/modules/auth/controllers';

export async function POST(request: NextRequest) {
  return handleVerifyOTP(request);
}
