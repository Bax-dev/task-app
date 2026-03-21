import { NextRequest } from 'next/server';
import { ReadBoards } from '@/app/api/modules/boards/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadBoards(request, id);
}
