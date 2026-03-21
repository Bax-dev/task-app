import { NextRequest } from 'next/server';
import { ReadIssueLink, RemoveIssueLink } from '@/app/api/modules/issue-links/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadIssueLink(request, id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return RemoveIssueLink(request, id);
}
