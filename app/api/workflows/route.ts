import { NextRequest } from 'next/server';
import { CreateWorkflow } from '@/app/api/modules/workflows/controllers';

export async function POST(request: NextRequest) {
  return CreateWorkflow(request);
}
