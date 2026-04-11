import { NextRequest } from 'next/server';
import { handleCreateDailyReport } from '@/app/api/modules/daily-reports/controllers';

export async function POST(request: NextRequest) {
  return handleCreateDailyReport(request);
}
