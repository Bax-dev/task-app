import { NextRequest } from 'next/server';
import { handleGetNotifications } from '@/app/api/modules/notifications/controllers';

export async function GET(request: NextRequest) {
  return handleGetNotifications(request);
}
