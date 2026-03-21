import { NextRequest } from 'next/server';
import { ReadDashboards } from '@/app/api/modules/dashboards/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadDashboards(request, id);
}
