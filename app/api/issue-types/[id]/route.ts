import { NextRequest } from 'next/server';
import { ReadIssueType, EditIssueType, RemoveIssueType } from '@/app/api/modules/issue-types/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadIssueType(request, id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return EditIssueType(request, id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return RemoveIssueType(request, id);
}
