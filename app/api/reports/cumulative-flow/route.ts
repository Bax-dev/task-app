import { NextRequest } from 'next/server';
import { ReadCumulativeFlow } from '@/app/api/modules/reports/controllers';

export async function GET(request: NextRequest) {
  return ReadCumulativeFlow(request);
}
