import { NextRequest } from 'next/server';
import { handleGetUnreadCount } from '@/app/api/modules/notifications/controllers';

export async function GET(request: NextRequest) {
  return handleGetUnreadCount(request);
}
