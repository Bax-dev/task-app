import { NextRequest } from 'next/server';
import { CreateBoardColumn } from '@/app/api/modules/boards/controllers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return CreateBoardColumn(request, id);
}
