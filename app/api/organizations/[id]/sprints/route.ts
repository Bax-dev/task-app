import { NextRequest } from 'next/server';
import { ReadSprints } from '@/app/api/modules/sprints/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadSprints(request, id);
}
