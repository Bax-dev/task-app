import { NextRequest } from 'next/server';
import { ReadBurndownChart } from '@/app/api/modules/reports/controllers';

export async function GET(request: NextRequest) {
  return ReadBurndownChart(request);
}
