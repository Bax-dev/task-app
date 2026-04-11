import { NextRequest } from 'next/server';
import {
  handleGetDailyReportSchedule,
  handleUpdateDailyReportSchedule,
} from '@/app/api/modules/daily-reports/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleGetDailyReportSchedule(request, id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleUpdateDailyReportSchedule(request, id);
}
