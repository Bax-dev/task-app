import { NextRequest } from 'next/server';
import { handleCreateActivityLog, handleGetUserActivityLogs } from '@/app/api/modules/activity-logs/controllers';

export async function POST(request: NextRequest) {
  return handleCreateActivityLog(request);
}

export async function GET(request: NextRequest) {
  return handleGetUserActivityLogs(request);
}
