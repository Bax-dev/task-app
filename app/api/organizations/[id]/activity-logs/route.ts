import { NextRequest } from 'next/server';
import { handleGetOrgActivityLogs } from '@/app/api/modules/activity-logs/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleGetOrgActivityLogs(request, id);
}
