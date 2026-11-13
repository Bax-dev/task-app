import { NextRequest } from 'next/server';
import { handleMfaDisable } from '@/app/api/modules/auth/controllers';

export async function POST(request: NextRequest) {
  return handleMfaDisable(request);
}
