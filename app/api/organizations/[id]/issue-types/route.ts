import { NextRequest } from 'next/server';
import { ReadIssueTypes } from '@/app/api/modules/issue-types/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadIssueTypes(request, id);
}
