import { NextRequest } from 'next/server';
import { handleSendOverdueReminders } from '@/app/api/modules/tasks/controllers';

export async function POST(request: NextRequest) {
  return handleSendOverdueReminders(request);
}
