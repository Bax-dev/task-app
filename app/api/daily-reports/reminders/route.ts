import { NextRequest } from 'next/server';
import { handleSendDailyReportReminders } from '@/app/api/modules/daily-reports/controllers';

export async function POST(request: NextRequest) {
  return handleSendDailyReportReminders(request);
}
