import { NextRequest } from 'next/server';
import { handleMarkAsRead } from '@/app/api/modules/notifications/controllers';

export async function POST(request: NextRequest) {
  return handleMarkAsRead(request);
}
