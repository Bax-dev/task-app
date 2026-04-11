import { NextRequest } from 'next/server';
import { handleGetDailyReports } from '@/app/api/modules/daily-reports/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleGetDailyReports(request, id);
}
