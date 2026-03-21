import { NextRequest } from 'next/server';
import { CreateDashboard } from '@/app/api/modules/dashboards/controllers';

export async function POST(request: NextRequest) {
  return CreateDashboard(request);
}
