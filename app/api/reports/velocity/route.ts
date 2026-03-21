import { NextRequest } from 'next/server';
import { ReadVelocityChart } from '@/app/api/modules/reports/controllers';

export async function GET(request: NextRequest) {
  return ReadVelocityChart(request);
}
