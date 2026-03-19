import { NextRequest } from 'next/server';
import { handleMarkAllAsRead } from '@/app/api/modules/notifications/controllers';

export async function POST(request: NextRequest) {
  return handleMarkAllAsRead(request);
}
