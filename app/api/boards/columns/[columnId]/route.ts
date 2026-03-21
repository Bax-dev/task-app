import { NextRequest } from 'next/server';
import { EditBoardColumn, RemoveBoardColumn } from '@/app/api/modules/boards/controllers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  const { columnId } = await params;
  return EditBoardColumn(request, columnId);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  const { columnId } = await params;
  return RemoveBoardColumn(request, columnId);
}
