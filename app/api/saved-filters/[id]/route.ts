import { NextRequest } from 'next/server';
import { ReadSavedFilter, EditSavedFilter, RemoveSavedFilter } from '@/app/api/modules/saved-filters/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadSavedFilter(request, id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return EditSavedFilter(request, id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return RemoveSavedFilter(request, id);
}
