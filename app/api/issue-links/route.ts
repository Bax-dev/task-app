import { NextRequest } from 'next/server';
import { CreateIssueLink } from '@/app/api/modules/issue-links/controllers';

export async function POST(request: NextRequest) {
  return CreateIssueLink(request);
}
