import { NextRequest } from 'next/server';
import { ReadIssueLinks } from '@/app/api/modules/issue-links/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadIssueLinks(request, id);
}
