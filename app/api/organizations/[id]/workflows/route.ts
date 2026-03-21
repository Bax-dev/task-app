import { NextRequest } from 'next/server';
import { ReadWorkflows } from '@/app/api/modules/workflows/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadWorkflows(request, id);
}
