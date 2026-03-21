import { NextRequest } from 'next/server';
import { ReadLabels } from '@/app/api/modules/labels/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadLabels(request, id);
}
