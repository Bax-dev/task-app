import { NextRequest } from 'next/server';
import { handleGetPreferences, handleUpdatePreferences } from '@/app/api/modules/users/controllers';

export async function GET(request: NextRequest) {
  return handleGetPreferences(request);
}

export async function PATCH(request: NextRequest) {
  return handleUpdatePreferences(request);
}
