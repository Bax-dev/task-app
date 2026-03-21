import { NextRequest } from 'next/server';
import { ReadComments } from '@/app/api/modules/comments/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadComments(request, id);
}
