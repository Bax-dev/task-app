import { NextRequest } from 'next/server';
import { CreateIssueType } from '@/app/api/modules/issue-types/controllers';

export async function POST(request: NextRequest) {
  return CreateIssueType(request);
}
